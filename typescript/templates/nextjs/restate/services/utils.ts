export function sendNotification(greetingId: string, name: string) {
  console.log(`Notification sent: ${greetingId} - ${name}`);
}

export function sendReminder(greetingId: string) {
  const simulateFailures = process.env.SIMULATE_FAILURES === "true";
  if (simulateFailures) {
    console.error(`[👻 SIMULATED] Failed to send reminder: ${greetingId}`);
    throw new Error(`[👻 SIMULATED] Failed to send reminder: ${greetingId}`);
  }
  console.log(`Reminder sent: ${greetingId}`);
}
