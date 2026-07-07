package com.example.restatestarter

import dev.restate.sdk.kotlin.*
import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.Service
import dev.restate.sdk.springboot.RestateComponent
import org.springframework.beans.factory.annotation.Value
import sendNotification
import sendReminder
import kotlin.time.Duration.Companion.seconds
import kotlinx.serialization.Serializable

@RestateComponent
@Service
class Greeter {

  @Value("\${greetingPrefix}")
  lateinit var greetingPrefix: String

  @Serializable
  data class Greeting(val name: String)
  @Serializable
  data class GreetingResponse(val message: String)

  @Handler
  suspend fun greet(req: Greeting): GreetingResponse {
    // Durably execute a set of steps; resilient against failures
    val greetingId = random().nextUUID().toString()
    runBlock("Notification") { sendNotification(greetingId, req.name) }
    sleep(1.seconds)
    runBlock("Reminder") { sendReminder(greetingId, req.name) }

    // Respond to caller
    return GreetingResponse("You said $greetingPrefix to ${req.name}!")
  }
}
