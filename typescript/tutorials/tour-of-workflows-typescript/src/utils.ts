import * as restate from "@restatedev/restate-sdk";
import { TerminalError } from "@restatedev/restate-sdk";

export type User = {
  name: string;
  email: string;
};

function failOnAlice(name: string, action: string) {
  if (name === "Alice") {
    console.error(`[👻 SIMULATED] Failed to ${action}: ${name}`);
    throw new Error(`[👻 SIMULATED] Failed to ${action}: ${name}`);
  }
}

function terminalErrorOnAlice(name: string, action: string) {
  if (name === "Alice") {
    console.error(
      `[👻 SIMULATED] Failed to ${action} for ${name}: not available in this country`,
    );
    throw new TerminalError(
      `[👻 SIMULATED] Failed to ${action} for ${name}: not available in this country`,
    );
  }
}

// <start_here>
export function sendWelcomeEmail(user: User) {
  failOnAlice(user.name, "send welcome email");
  console.log(`Welcome email sent: ${user.email}`);
}
// <end_here>

export function createUser(userId: string, user: User) {
  console.log(`User entry created in DB: ${userId}`);
  return true;
}

export function deleteUser(userId: string) {
  console.log(`User entry deleted in DB: ${userId}`);
  return true;
}

export function sendVerificationEmail(
  id: string,
  user: User,
  verificationSecret: string,
) {
  console.log(`Verification email sent: ${user.email} \n 
  For the signals section, verify via: curl localhost:8080/SignupWithSignalsWorkflow/${id}/verifyEmail --json '{"secret": "${verificationSecret}"} \n'
  For the timers section, verify via: curl localhost:8080/SignupWithTimersWorkflow/${id}/verifyEmail --json '{"secret": "${verificationSecret}"} \n'`);
}

export function sendReminderEmail(
  id: string,
  user: User,
  verificationSecret: string,
)  {
  console.log(`Reminder email sent: ${user.email} \n 
  Verify via: curl localhost:8080/SignupWithTimersWorkflow/${id}/verifyEmail --json '{"secret": "${verificationSecret}"} \n'`);
}

export function activateUser(userId: string) {
  console.log(`User account activated: ${userId}`);
}

export function deactivateUser(userId: string) {
  console.log(`User account deactivated: ${userId}`);
}

export function subscribeToPaidPlan(user: User) {
  terminalErrorOnAlice(user.name, "subscribe to paid plan");
  console.log(`User subscribed to paid plan: ${user.name}`);
  return true;
}

export function cancelSubscription(user: User) {
  console.log(`User subscription cancelled: ${user.name}`);
  return true;
}

export const userService = restate.service({
  name: "UserService",
  handlers: {
    createUser: async (
      ctx: restate.Context,
      req: { userId: string; user: User },
    ) => {
      return ctx.run("create user", () => createUser(req.userId, req.user));
    },
  },
});
