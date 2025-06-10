package com.example.restatestarter

import dev.restate.sdk.kotlin.*
import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.springboot.RestateService
import org.springframework.beans.factory.annotation.Value
import sendNotification
import sendReminder
import kotlin.time.Duration.Companion.seconds

@RestateService
class Greeter {

  @Value("\${greetingPrefix}")
  lateinit var greetingPrefix: String

  @Handler
  suspend fun greet(ctx: Context, name: String): String {
    // Durably execute a set of steps; resilient against failures
    val greetingId = ctx.random().nextUUID().toString()
    ctx.runBlock("Notification") { sendNotification(greetingId, name) }
    ctx.sleep(1.seconds)
    ctx.runBlock("Reminder") { sendReminder(greetingId, name) }

    // Respond to caller
    return "You said $greetingPrefix to $name!"
  }
}
