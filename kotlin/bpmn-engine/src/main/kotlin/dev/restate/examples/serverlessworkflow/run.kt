package dev.restate.examples.serverlessworkflow

import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder

fun main() {
  RestateHttpEndpointBuilder
          .builder()
          .withService(WorkflowExecutor())
          .withService(WorkflowManager())
          .buildAndListen()
}