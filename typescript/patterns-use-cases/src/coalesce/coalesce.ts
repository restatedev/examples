import * as restate from "@restatedev/restate-sdk";

interface TargetWorkflowInput {}
interface TargetWorkflowOutput {
  key: string;
}

const targetWorkflow = restate.workflow({
  name: "targetWorkflow",
  handlers: {
    run: async (
      ctx: restate.WorkflowContext,
      input: TargetWorkflowInput,
    ): Promise<TargetWorkflowOutput> => {
      // simulate some work happening
      await ctx.sleep(5_000);

      return { key: ctx.key };
    },
  },
});
export type TargetWorkflow = typeof targetWorkflow;
const TargetWorkflow: TargetWorkflow = { name: "targetWorkflow" };

interface CoalesceState {
  invocationId: restate.InvocationId;
  count: number;
}

const coalesce = restate.object({
  name: "coalesce",
  handlers: {
    submit: restate.handlers.object.shared(
      async (
        ctx: restate.ObjectSharedContext<CoalesceState>,
        input: TargetWorkflowInput,
      ): Promise<TargetWorkflowOutput> => {
        let invocationId = await ctx.get("invocationId");
        if (invocationId == null) {
          // there might be no in flight invocation, run the slow path to be sure
          invocationId = await ctx
            .objectClient(Coalesce, ctx.key)
            .submitLocked(input);
        }

        return ctx.attach(invocationId);
      },
    ),
    submitLocked: async (
      ctx: restate.ObjectContext<CoalesceState>,
      input: TargetWorkflowInput,
    ): Promise<restate.InvocationId> => {
      let invocationId = await ctx.get("invocationId");
      const count = (await ctx.get("count")) ?? 0;

      if (invocationId !== null) {
        // we lost the race
        return invocationId;
      }

      // there is no in flight invocation, create one
      const workflowID = `${ctx.key}-${count}`;
      const handle = ctx
        .workflowSendClient(TargetWorkflow, workflowID)
        .run(input);
      invocationId = await handle.invocationId;

      ctx.objectSendClient(Coalesce, ctx.key).awaitCompletion(invocationId);

      ctx.set("invocationId", invocationId);
      ctx.set("count", count + 1);

      return invocationId;
    },
    awaitCompletion: restate.handlers.object.shared(
      async (
        ctx: restate.ObjectSharedContext<CoalesceState>,
        invocationId: restate.InvocationId,
      ) => {
        try {
          // wait for it to finish, but don't bother deserialising the result
          await ctx.attach(invocationId, restate.serde.binary);
        } catch (e) {
          if (e instanceof restate.TerminalError) {
            // attach can throw if the invocation itself, or if it wasn't found (eg somehow we are past the retention period)
            // either way, we are completed.
            ctx.objectSendClient(Coalesce, ctx.key).completed(invocationId);
          }
          throw e;
        }
        ctx.objectSendClient(Coalesce, ctx.key).completed(invocationId);
      },
    ),
    completed: async (
      ctx: restate.ObjectContext<CoalesceState>,
      invocationId: restate.InvocationId,
    ) => {
      if ((await ctx.get("invocationId")) == invocationId) {
        ctx.clear("invocationId");
      }
    },
  },
});

type Coalesce = typeof coalesce;
const Coalesce: Coalesce = { name: "coalesce" };

restate.endpoint().bind(targetWorkflow).bind(coalesce).listen();
