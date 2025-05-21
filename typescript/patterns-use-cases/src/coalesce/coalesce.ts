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

interface Target {
  service: string;
  handler: string;
  key?: string;
}

// supervisor watches an invocation (must be from a workflow or with an idempotency key) for its completion and then calls back
const supervisor = restate.service({
  name: "supervisor",
  handlers: {
    watch: async (
      ctx: restate.Context,
      input: { invocationId: restate.InvocationId; target: Target },
    ): Promise<void> => {
      const done = () =>
        ctx.genericSend({
          service: input.target.service,
          method: input.target.handler,
          key: input.target.key,
          parameter: input.invocationId,
          inputSerde: restate.serde.json,
        });

      try {
        await ctx.attach(input.invocationId, restate.serde.binary);
      } catch (e) {
        if (e instanceof restate.TerminalError) {
          done();
        }
        throw e;
      }
      done();
    },
  },
});

type Supervisor = typeof supervisor;
const Supervisor: Supervisor = { name: "supervisor" };

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

      ctx.serviceSendClient(Supervisor).watch({
        invocationId,
        target: {
          service: "coalesce",
          handler: "onCompletion",
          key: ctx.key,
        },
      });

      ctx.set("invocationId", invocationId);
      ctx.set("count", count + 1);

      return invocationId;
    },
    onCompletion: async (
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

restate
  .endpoint()
  .bind(targetWorkflow)
  .bind(supervisor)
  .bind(coalesce)
  .listen();
