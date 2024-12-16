import * as restate from "@restatedev/restate-sdk";

export enum State {
  UP = "UP",
  DOWN = "DOWN",
}

export async function bringUpMachine(ctx: restate.Context, machineId: string){
  maybeCrash(0.4);
  await ctx.sleep(5000);
}

export async function tearDownMachine(ctx: restate.Context, machineId: string){
  maybeCrash(0.4);
  await ctx.sleep(5000);
}

const killProcess: boolean = Boolean(process.env.CRASH_PROCESS);

export function maybeCrash(probability: number = 0.5): void {
  if (Math.random() < probability) {
    console.error("A failure happened!");

    if (killProcess) {
      console.error("--- CRASHING THE PROCESS ---");
      process.exit(1);
    } else {
      throw new Error("A failure happened!");
    }
  }
}
