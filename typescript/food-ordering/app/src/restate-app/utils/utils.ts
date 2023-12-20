import * as restate from "@restatedev/restate-sdk";

export function fail(id: string, msg: string) {
  const errorMsg = `[${id}] Error: ${msg}`;
  console.error(errorMsg);
  throw new Error(errorMsg);
}

export const completed = async (ctx: restate.RpcContext): Promise<boolean> => {
  if (await ctx.get<boolean>("completed") === true) {
    return true
  }
  ctx.set("completed", true)
  return false
}
