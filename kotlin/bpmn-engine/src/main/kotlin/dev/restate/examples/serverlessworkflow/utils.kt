package dev.restate.examples.serverlessworkflow

import com.fasterxml.jackson.databind.JsonNode
import dev.restate.sdk.common.TerminalException
import io.serverlessworkflow.api.Workflow
import io.serverlessworkflow.api.functions.FunctionDefinition
import io.serverlessworkflow.utils.WorkflowUtils
import net.thisptr.jackson.jq.*
import net.thisptr.jackson.jq.path.Path

private val FUNCTION_REFERENCE_REGEX = Regex("fn:([a-zA-Z0-9_\\-]*)")

fun executeBooleanExpression(workflow: Workflow, input: JsonNode, expression: String): Boolean {
    val result = executeExpression(workflow, input, expression)
    check(result.isBoolean)
    return result.asBoolean()
}

fun executeExpression(workflow: Workflow, input: JsonNode, expression: String): JsonNode {
    var expression = expression.removePrefix("\${").removeSuffix("}")

    // Now replace all the functions!
    expression = FUNCTION_REFERENCE_REGEX.replace(expression) {
        val referencedFn = it.groupValues[1]
        val referencedFnDefinition = workflow.functions.functionDefs.find { f -> f.name == referencedFn }

        checkNotNull(referencedFnDefinition)
        check(referencedFnDefinition.type == FunctionDefinition.Type.EXPRESSION)

        referencedFnDefinition.operation
    }

    val rootScope: Scope = Scope.newEmptyScope()
    BuiltinFunctionLoader.getInstance().loadFunctions(Versions.JQ_1_6, rootScope)

    val childScope: Scope = Scope.newChildScope(rootScope)
    val q = JsonQuery.compile(expression, Versions.JQ_1_6)

    val out: MutableList<JsonNode> = ArrayList()
    q.apply(childScope, input) { e: JsonNode -> out.add(e) }
    check(out.size == 1)

    return out[0]
}

fun mutateExpression(workflow: Workflow, input: JsonNode, output: JsonNode, expression: String) {
    var expression = expression.removePrefix("\${").removeSuffix("}")

    // Now replace all the functions!
    expression = FUNCTION_REFERENCE_REGEX.replace(expression) {
        val referencedFn = it.groupValues[1]
        val referencedFnDefinition = workflow.functions.functionDefs.find { f -> f.name == referencedFn }

        checkNotNull(referencedFnDefinition)
        check(referencedFnDefinition.type == FunctionDefinition.Type.EXPRESSION)

        referencedFnDefinition.operation
    }

    val rootScope: Scope = Scope.newEmptyScope()
    BuiltinFunctionLoader.getInstance().loadFunctions(Versions.JQ_1_6, rootScope)

    val childScope: Scope = Scope.newChildScope(rootScope)
    val q = JsonQuery.compile(expression, Versions.JQ_1_6)

    q.apply(childScope, input, object : Output {
        override fun emit(out: JsonNode?) {
            TODO("Not yet implemented")
        }

        override fun emit(out: JsonNode, opath: Path) {
            opath.mutate(out) { output }
        }
    })
}
