package dev.restate.examples.serverlessworkflow

import com.fasterxml.jackson.core.type.TypeReference
import com.google.protobuf.Empty
import com.google.protobuf.Value
import dev.restate.examples.serverlessworkflow.generated.ServerlessWorkflowProto.*
import dev.restate.examples.serverlessworkflow.generated.WorkflowManagerRestateKt
import dev.restate.examples.serverlessworkflow.generated.getOutputResponse
import dev.restate.examples.serverlessworkflow.generated.getStateResponse
import dev.restate.sdk.common.CoreSerdes
import dev.restate.sdk.common.StateKey
import dev.restate.sdk.kotlin.RestateContext
import dev.restate.sdk.serde.jackson.JacksonSerdes
import io.cloudevents.v1.proto.CloudEvent
import org.apache.logging.log4j.LogManager
import org.apache.logging.log4j.Logger

class WorkflowManager: WorkflowManagerRestateKt.WorkflowManagerRestateKtImplBase() {

  companion object {
    private val LOGGER: Logger = LogManager.getLogger(WorkflowManager::class.java)

    private val CLOUDEVENT_SERDE = CoreSerdes.ofProtobuf(CloudEvent.parser())

    private val CURRENT_STATE: StateKey<String> = StateKey.string("current_state")
    private val OUTPUT: StateKey<Value> = StateKey.of("output", CoreSerdes.ofProtobuf(Value.parser()))
  }

  override suspend fun getState(context: RestateContext, request: GetStateRequest): GetStateResponse {
    val state = context.get(CURRENT_STATE)
    return if (state.isNullOrEmpty()) {
      getStateResponse {
        this.empty = Empty.getDefaultInstance()
      }
    } else {
      getStateResponse {
        this.state = state
      }
    }
  }

  override suspend fun setState(context: RestateContext, request: SetStateRequest) {
    context.set(CURRENT_STATE, request.state)
  }

  override suspend fun waitEvent(context: RestateContext, request: WaitEventRequest) {
    val event = context.get(eventKey(request.eventName))
    if (event != null) {
      completeEventListener(context, request.awakeableId, event)
      return
    }

    val listenersKey = eventListenersKey(request.eventName)
    val listeners: HashSet<String> = context.get(listenersKey) ?: HashSet()
    listeners.add(request.awakeableId)
    context.set(listenersKey, listeners)
  }

  override suspend fun notifyEvent(context: RestateContext, request: NotifyEventRequest) {
    // User can decide whether they want to allow overwriting the previously resolved value or not
//    val signalKey: StateKey<SignalCompletion> = eventKey(request.getSignalKey())
//    val `val`: Optional<SignalCompletion> = context.get(signalKey)
//    if (`val`!!.isPresent()) {
//      throw TerminalException("Can't complete an already completed signal")
//    }
//    context.set(signalKey, request.getCompletion())
//
//    val listenersKey = eventListenersKey(request.getSignalKey())
//    val listeners: Set<String> = context.get(listenersKey).orElse(emptySet())
//    for (listener in listeners) {
//      completeEventListener(context, listener, request.getCompletion())
//    }
//    context.clear(listenersKey)
  }

  override suspend fun getOutput(context: RestateContext, request: GetOutputRequest): GetOutputResponse {
    val output = context.get(OUTPUT)
    return if (output == null) {
      getOutputResponse {
        this.empty = Empty.getDefaultInstance()
      }
    } else {
      getOutputResponse {
        this.output = output
      }
    }
  }

  override suspend fun setOutput(context: RestateContext, request: SetOutputRequest) {
    context.set(OUTPUT, request.output)
  }

  private suspend fun completeEventListener(
          context: RestateContext, awakeableId: String, event: CloudEvent) {
    context.awakeableHandle(awakeableId).resolve(CLOUDEVENT_SERDE, event)
  }

  private fun eventKey(key: String): StateKey<CloudEvent> {
    return StateKey.of("_signal_$key", CLOUDEVENT_SERDE)
  }

  private fun eventListenersKey(key: String): StateKey<HashSet<String>> {
    return StateKey.of("_signal_listeners_$key", JacksonSerdes.of(object : TypeReference<HashSet<String>>() {}))
  }
}
