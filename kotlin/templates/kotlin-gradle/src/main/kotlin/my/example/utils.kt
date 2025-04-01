package my.example

import kotlin.random.Random

fun sendNotification(greetingId: String, name: String) {
    if (Random.nextDouble() < 0.5) { // 50% chance of failure
        println("👻 Failed to send notification: $greetingId - $name")
        throw Exception("Failed to send notification: $greetingId - $name")
    }
    println("Notification sent: $greetingId - $name")
}

fun sendReminder(greetingId: String) {
    if (Random.nextDouble() < 0.5) { // 50% chance of failure
        println("👻 Failed to send reminder: $greetingId")
        throw Exception("Failed to send reminder: $greetingId")
    }
    println("Reminder sent: $greetingId")
}