import * as restate from "@restatedev/restate-sdk";

function failOnAlice(name: string){
  if (name === "Alice") {
    console.error(`[👻 SIMULATED] Failed to create user entry: ${name}`);
    throw new Error(`[👻 SIMULATED] Failed to create user entry: ${name}`);
  }
}

// <start_here>
export function sendWelcomeEmail(user: { name: string; email: string }) {
  // failOnAlice(user.name)
  console.log(`Welcome email sent: ${user.email}`);
}
// <end_here>

export function createUserInDB(user: { name: string; email: string }) {
  console.log(`User entry created in DB: ${user.name}`);
  return true;
}

export function deleteUserInDB(user: { name: string; email: string }) {
  console.log(`User entry deleted in DB: ${user.name}`);
  return true;
}

export function sendVerificationEmail(
    id: string,
  user: { name: string; email: string },
  verificationSecret: string,
) {
  console.log(`Verification email sent: ${user.email} \n Verify via: curl localhost:8080/signup-with-signals/${id}/verifyEmail --json '{"secret": "${verificationSecret}"}'`);
}

export function sendReminderEmail(
  user: { name: string; email: string },
  verificationSecret: string,
) {
  console.log(`Reminder email sent: ${user.email}`);
}

export function callActivateUserAPI(userId: string) {
  console.log(`User account activated: ${userId}`);
}

export function callDeactivateUserAPI(userId: string) {
  console.log(`User account deactivated: ${userId}`);
}

export function subscribeToPaidPlan(user: { name: string; email: string }) {
  console.log(`User subscribed to paid plan: ${user.name}`);
  return true;
}

export function cancelSubscription(user: { name: string; email: string }) {
  console.log(`User subscription cancelled: ${user.name}`);
  return true;
}

export const emailService = restate.service({
  name: "email-service",
  handlers: {
    sendWelcome: async (
      ctx: restate.Context,
      user: { name: string; email: string },
    ) => {
      await ctx.run(() => sendWelcomeEmail(user));
      return { success: true, message: "Email sent successfully" };
    },
  },
});

export const userService = restate.service({
  name: "user-service",
  handlers: {
    createUser: async (
      ctx: restate.Context,
      user: { id: string; name: string; email: string },
    ) => {
      return ctx.run(() =>
        createUserInDB({ name: user.name, email: user.email }),
      );
    },
  },
});
