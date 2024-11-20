package org.acme;

// You can remove this file.
// It's only purpose is providing stubs for the template.

class Utils {
    public static void sendNotification(String greetingId, String name){
        if (Math.random() < 0.5) { // 50% chance of failure
            System.out.println("👻 Failed to send notification: " + greetingId + " - " + name);
            throw new Error("Failed to send notification: " + greetingId + " - " + name);
        }
        System.out.println("Notification sent: " + greetingId + " - " + name);
    }

    public static void sendReminder(String greetingId){
        if (Math.random() < 0.5) { // 50% chance of failure
            System.out.println("👻 Failed to send reminder: " + greetingId);
            throw new Error("Failed to send reminder: " + greetingId);
        }
        System.out.println("Reminder sent: " + greetingId);
    }
}