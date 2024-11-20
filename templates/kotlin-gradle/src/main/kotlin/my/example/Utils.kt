package my.example

fun sendNotification(greetingId: String, name: String) {
    if (Math.random() < 0.5) { // 30% chance of failure
        println("Failed to send notification: $greetingId - $name")
        throw Error("Failed to send notification: $greetingId - $name")
    }
    println("Notification sent: $greetingId - $name")
}

fun sendReminder(greetingId: String) {
    if (Math.random() < 0.5) { // 30% chance of failure
        println("Failed to send reminder: $greetingId")
        throw Error("Failed to send reminder: $greetingId")
    }
    println("Reminder sent: $greetingId")
}