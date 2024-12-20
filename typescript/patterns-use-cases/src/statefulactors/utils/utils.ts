import * as restate from "@restatedev/restate-sdk";

export enum Status {
  UP = "UP",
  DOWN = "DOWN",
}

export async function bringUpMachine(ctx: restate.Context, machineId: string){
  ctx.console.info(`Beginning transition of ${machineId} to up`);
  maybeCrash(0.4);
  await ctx.sleep(5000);
  ctx.console.info(`Done transitioning ${machineId} to up`);
}

export async function tearDownMachine(ctx: restate.Context, machineId: string){
  ctx.console.info(`Beginning transition of ${machineId} to down`);
  maybeCrash(0.4);
  await ctx.sleep(5000);
  ctx.console.info(`Done transitioning ${machineId} to down`);
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
