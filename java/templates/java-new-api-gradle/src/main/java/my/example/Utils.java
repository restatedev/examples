package my.example;

// You can remove this file.
// It's only purpose is providing stubs for the template.

class Utils {
    public static void sendNotification(String greetingId, String name){
        if (Math.random() < 0.7 && name.equals("Alice")) { // 70% chance of failure
            System.out.println("[👻 SIMULATED] Failed to send notification: " + greetingId + " - " + name);
            throw new RuntimeException("[👻 SIMULATED] Failed to send notification: " + greetingId + " - " + name);
        }
        System.out.println("Notification sent: " + greetingId + " - " + name);
    }

    public static void sendReminder(String greetingId, String name){
        if (Math.random() < 0.7 && name.equals("Alice")) { // 70% chance of failure
            System.out.println("[👻 SIMULATED] Failed to send reminder: " + greetingId);
            throw new RuntimeException("[👻 SIMULATED] Failed to send reminder: " + greetingId);
        }
        System.out.println("Reminder sent: " + greetingId);
    }
}