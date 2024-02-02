package dev.restate.examples.serverlessworkflow

import com.fasterxml.jackson.databind.JsonNode
import com.fasterxml.jackson.databind.ObjectMapper
import com.google.protobuf.InvalidProtocolBufferException
import com.google.protobuf.Value
import com.google.protobuf.util.JsonFormat
import dev.restate.examples.serverlessworkflow.generated.*
import dev.restate.examples.serverlessworkflow.generated.ServerlessWorkflowProto.ExecuteRequest
import dev.restate.sdk.common.TerminalException
import dev.restate.sdk.kotlin.RestateContext
import io.serverlessworkflow.api.Workflow
import io.serverlessworkflow.api.end.End
import io.serverlessworkflow.api.interfaces.State
import io.serverlessworkflow.api.states.DefaultState
import io.serverlessworkflow.api.states.InjectState
import io.serverlessworkflow.api.states.OperationState
import io.serverlessworkflow.api.states.SleepState
import io.serverlessworkflow.api.states.SwitchState
import io.serverlessworkflow.api.transitions.Transition
import io.serverlessworkflow.spi.WorkflowValidatorProvider
import io.serverlessworkflow.utils.WorkflowUtils
import org.apache.logging.log4j.LogManager
import org.apache.logging.log4j.Logger
import java.time.Duration
import kotlin.time.toKotlinDuration


class WorkflowExecutor: WorkflowExecutorRestateKt.WorkflowExecutorRestateKtImplBase() {

  companion object {
    private val LOGGER: Logger = LogManager.getLogger(WorkflowExecutor::class.java)
    private val OBJECT_MAPPER = ObjectMapper()

    fun protobufValueToJsonNode(value: Value): JsonNode {
      val valAsString: String
      try {
        valAsString = JsonFormat.printer().print(value)
      } catch (e: InvalidProtocolBufferException) {
        throw RuntimeException(e)
      }
      return OBJECT_MAPPER.readTree(valAsString)
    }

    fun jsonNodeToProtobufValue(jsonNode: JsonNode): Value {
      val jsonNodeAsString = jsonNode.toString()
      val outValue = Value.newBuilder()
      try {
        JsonFormat.parser().merge(jsonNodeAsString, outValue)
      } catch (e: InvalidProtocolBufferException) {
        throw RuntimeException(e)
      }
      return outValue.build()
    }
  }

  override suspend fun execute(context: RestateContext, request: ExecuteRequest) {
    val workflowManager = WorkflowManagerRestateKt.newClient(context)

    // If there's an output, don't execute
    if (workflowManager.getOutput(getOutputRequest { workflowId = request.workflowId }).await().hasOutput()) {
      LOGGER.info("Already executed a workflow with id {}, skipping it", request.workflowId)
      return
    }

    // Parse workflow definition
    val workflow: Workflow
    try {
        workflow = Workflow.fromSource(request.workflowDefinition)
    } catch (e: Exception) {
      throw TerminalException(TerminalException.Code.FAILED_PRECONDITION, "Can't parse the workflow: " + e.message)
    }

    // Validate workflow
    val validator = WorkflowValidatorProvider.getInstance().get().setWorkflow(workflow).setSource(request.workflowDefinition)
    val validationResult = validator.validate()
    if (validationResult.size != 0) {
      throw TerminalException("Bad workflow definition: " + validationResult[0])
    }

    val stateMachine = WorkflowStateMachine(workflow, context, protobufValueToJsonNode(request.input))
    val output = stateMachine.execute()

    workflowManager.oneWay().setOutput(setOutputRequest {
      this.workflowId = request.workflowId
      this.output = jsonNodeToProtobufValue(output)
    })
  }

  class WorkflowStateMachine(private val workflow: Workflow, private val context: RestateContext, input: JsonNode) {
    private val workflowManager = WorkflowManagerRestateKt.newClient(context)

    private var nextStateName = workflow.start.stateName
    private var reachedEnd = false
    private var currentState = input

    suspend fun execute(): JsonNode {
      // Record the initial state
      transitionState(nextStateName)

      while (!reachedEnd) {
        val state = WorkflowUtils.getStateWithName(workflow, nextStateName)

        LOGGER.info("State {} input {}", state.name, currentState.toString())
        handleState(state)
        LOGGER.info("State {} output {}", state.name, currentState.toString())
      }

      return currentState
    }

    private suspend fun transitionOrEnd(state: State) {
      transitionOrEnd(state.transition, state.end)
    }

    private suspend fun transitionOrEnd(transition: Transition?, end: End?) {
      if (transition != null) {
        transitionState(transition.nextState)
      }
      if (end != null) {
        LOGGER.info("Reached end state {}", nextStateName)
        this.reachedEnd = true
      }
    }

    private suspend fun transitionState(nextState: String) {
        LOGGER.info("Transition to {}", nextState)
        workflowManager.oneWay().setState(setStateRequest {
          this.workflowId = workflowId
          this.state = nextState
        })
      this.nextStateName = nextState
    }

    private suspend fun handleState(state: State) {
      when(state.type) {
        DefaultState.Type.INJECT -> {
          handleInjectState(state as InjectState)
        }
        DefaultState.Type.SLEEP -> {
          handleSleepState(state as SleepState)
        }
        DefaultState.Type.SWITCH -> {
          handleSwitchState(state as SwitchState)
        }
        DefaultState.Type.OPERATION -> {
          handleOperationState(state as OperationState)
        }
        else -> {
          throw TerminalException("Unsupported state $state")
        }
      }
    }

    // --- Handle different state types

    private suspend fun handleInjectState(state: InjectState) {
      LOGGER.info("Handling inject state")
      this.currentState = WorkflowUtils.mergeNodes(this.currentState, state.data)
      transitionOrEnd(state)
    }

    private suspend fun handleSleepState(state: SleepState) {
      LOGGER.info("Handling sleep state")
      context.sleep(
              Duration.parse(state.duration).toKotlinDuration()
      )
      transitionOrEnd(state)
    }

    private suspend fun handleSwitchState(switchState: SwitchState) {
      LOGGER.info("Handling switch state")
      for (dataCondition in switchState.dataConditions) {
        if (executeBooleanExpression(workflow, currentState, dataCondition.condition)) {
          LOGGER.info("Got a match on condition {}", dataCondition.name)
          transitionOrEnd(dataCondition.transition, dataCondition.end)
          return
        }
      }

      transitionOrEnd(switchState.defaultCondition.transition, switchState.defaultCondition.end)
    }

    private suspend fun handleOperationState(operationState: OperationState) {
      for (action in operationState.actions) {
        val referencedFnDefinition = workflow.functions.functionDefs.find { f -> f.name == action.functionRef.refName }
        checkNotNull(referencedFnDefinition)

        val input = if (action.actionDataFilter.fromStateData != null) {
          executeExpression(workflow, currentState, action.actionDataFilter.fromStateData)
        } else {
          currentState
        }
        val output = executeExpression(workflow, input, referencedFnDefinition.operation)
        if (action.actionDataFilter.toStateData != null) {
          mutateExpression(workflow, currentState, output, action.actionDataFilter.toStateData)
        }
      }

      transitionOrEnd(operationState)
    }
  }
}
