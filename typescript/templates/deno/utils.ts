// You can remove this file.
// It's only purpose is providing stubs for the template.

export function sendNotification(greetingId: string, name: string) {
  if (Math.random() < 0.5) {
    // 50% chance of failure
    console.error(`👻 Failed to send notification: ${greetingId} - ${name}`);
    throw new Error(`Failed to send notification ${greetingId} - ${name}`);
  }
  console.log(`Notification sent: ${greetingId} - ${name}`);
}

export function sendReminder(greetingId: string) {
  if (Math.random() < 0.5) {
    // 50% chance of failure
    console.error(`👻 Failed to send reminder: ${greetingId}`);
    throw new Error(`Failed to send reminder: ${greetingId}`);
  }
  console.log(`Reminder sent: ${greetingId}`);
}
