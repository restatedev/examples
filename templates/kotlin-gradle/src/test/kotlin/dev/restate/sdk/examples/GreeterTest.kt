package dev.restate.sdk.examples

import dev.restate.sdk.examples.generated.GreeterGrpcKt.GreeterCoroutineStub
import dev.restate.sdk.examples.generated.greetRequest
import dev.restate.sdk.testing.RestateGrpcChannel
import dev.restate.sdk.testing.RestateRunner
import dev.restate.sdk.testing.RestateRunnerBuilder
import io.grpc.ManagedChannel
import kotlinx.coroutines.test.runTest
import org.junit.jupiter.api.Assertions.assertEquals
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.extension.RegisterExtension

class GreeterTest {
    companion object {
        // Runner runs Restate using testcontainers and registers services
        @RegisterExtension
        private val restateRunner: RestateRunner = RestateRunnerBuilder.create()
                // Service to test
                .withService(Greeter())
                .buildRunner()
    }

    @Test
    fun testGreet(
            // Channel to send requests to Restate services
            @RestateGrpcChannel channel: ManagedChannel) = runTest {
        val client = GreeterCoroutineStub(channel)
        val response = client.greet(greetRequest { name = "Francesco" })

        assertEquals("Hello Francesco for the 1 time!", response.getMessage())
    }
}
