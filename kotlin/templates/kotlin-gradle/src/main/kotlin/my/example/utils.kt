package my.example

import kotlin.random.Random

fun sendNotification(greetingId: String, name: String) {
    if (Random.nextDouble() < 0.7 && name == "Alice") { // 70% chance of failure
        println("[👻 SIMULATED] Failed to send notification: $greetingId - $name")
        throw Exception("[👻 SIMULATED] Failed to send notification: $greetingId - $name")
    }
    println("Notification sent: $greetingId - $name")
}

fun sendReminder(greetingId: String, name: String) {
    if (Random.nextDouble() < 0.7 && name == "Alice") { // 70% chance of failure
        println("[👻 SIMULATED] Failed to send reminder: $greetingId")
        throw Exception("[👻 SIMULATED] Failed to send reminder: $greetingId")
    }
    println("Reminder sent: $greetingId")
}