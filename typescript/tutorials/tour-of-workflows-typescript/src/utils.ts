import * as restate from "@restatedev/restate-sdk";

export function createUserInDB(user: { name: string; email: string }) {
  if (Math.random() < 0.7 && user.name === "Alice") {
    // 70% chance of failure
    console.error(`[👻 SIMULATED] Failed to create user entry: ${user.name}`);
    throw new Error(`[👻 SIMULATED] Failed to create user entry: ${user.name}`);
  }
  console.log(`User entry created: ${user.name}`);
  return true;
}

export function deleteUserInDB(user: { name: string; email: string }) {
  if (Math.random() < 0.7 && user.name === "Alice") {
    // 70% chance of failure
    console.error(`[👻 SIMULATED] Failed to create user entry: ${user.name}`);
    throw new Error(`[👻 SIMULATED] Failed to create user entry: ${user.name}`);
  }
  console.log(`User entry created: ${user.name}`);
  return true;
}

export function sendWelcomeEmail(user: { name: string; email: string }) {
  if (Math.random() < 0.7 && user.name === "Alice") {
    // 70% chance of failure
    console.error(`[👻 SIMULATED] Failed to send email: ${user.email}`);
    throw new Error(`[👻 SIMULATED] Failed to send email: ${user.email}`);
  }
  console.log(`Email sent: ${user.email}`);
}

export function sendVerificationEmail(
  user: { name: string; email: string },
  verificationSecret: string,
) {
  if (Math.random() < 0.7 && user.name === "Alice") {
    // 70% chance of failure
    console.error(`[👻 SIMULATED] Failed to send email: ${user.email}`);
    throw new Error(`[👻 SIMULATED] Failed to send email: ${user.email}`);
  }
  console.log(`Email sent: ${user.email}`);
}

export function sendReminderEmail(
  user: { name: string; email: string },
  verificationSecret: string,
) {
  if (Math.random() < 0.7 && user.name === "Alice") {
    // 70% chance of failure
    console.error(`[👻 SIMULATED] Failed to send email: ${user.email}`);
    throw new Error(`[👻 SIMULATED] Failed to send email: ${user.email}`);
  }
  console.log(`Email sent: ${user.email}`);
}

export function callActivateUserAPI(userId: string) {
  if (Math.random() < 0.7 && userId === "123") {
    // 70% chance of failure
    console.error(`[👻 SIMULATED] Failed to activate user account: ${userId}`);
    throw new Error(
      `[👻 SIMULATED] Failed to activate user account: ${userId}`,
    );
  }
  console.log(`User account activated: ${userId}`);
}

export function callDeactivateUserAPI(userId: string) {
  if (Math.random() < 0.7 && userId === "123") {
    // 70% chance of failure
    console.error(`[👻 SIMULATED] Failed to activate user account: ${userId}`);
    throw new Error(
      `[👻 SIMULATED] Failed to activate user account: ${userId}`,
    );
  }
  console.log(`User account activated: ${userId}`);
}

export function subscribeToPaidPlan(user: { name: string; email: string }) {
  if (Math.random() < 0.7 && user.name === "Alice") {
    // 70% chance of failure
    console.error(`[👻 SIMULATED] Failed to create user entry: ${user.name}`);
    throw new Error(`[👻 SIMULATED] Failed to create user entry: ${user.name}`);
  }
  console.log(`User entry created: ${user.name}`);
  return true;
}

export function cancelSubscription(user: { name: string; email: string }) {
  if (Math.random() < 0.7 && user.name === "Alice") {
    // 70% chance of failure
    console.error(`[👻 SIMULATED] Failed to create user entry: ${user.name}`);
    throw new Error(`[👻 SIMULATED] Failed to create user entry: ${user.name}`);
  }
  console.log(`User entry created: ${user.name}`);
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
