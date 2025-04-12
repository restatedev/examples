fun sendNotification(greetingId: String, name: String) {
    if (Math.random() < 0.5) { // 50% chance of failure
        println("👻 Failed to send notification: $greetingId - $name")
        throw RuntimeException("Failed to send notification: $greetingId - $name")
    }
    println("Notification sent: $greetingId - $name")
}

fun sendReminder(greetingId: String) {
    if (Math.random() < 0.5) { // 50% chance of failure
        println("👻 Failed to send reminder: $greetingId")
        throw RuntimeException("Failed to send reminder: $greetingId")
    }
    println("Reminder sent: $greetingId")
}