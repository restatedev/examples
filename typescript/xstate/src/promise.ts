import {
  ActorLogic,
  ActorRefFrom,
  AnyActorLogic,
  AnyStateMachine,
  InvokeConfig,
  NonReducibleUnknown,
  Snapshot,
} from "xstate";
import {AnyActorSystem} from "xstate/dist/declarations/src/system";
import {RestateActorSystem, SerialisableActorRef, serialiseActorRef, xStateApi} from "./lib";
import * as restate from "@restatedev/restate-sdk";
import {TerminalError} from "@restatedev/restate-sdk";

export type PromiseSnapshot<TOutput, TInput> = Snapshot<TOutput> & {
  input: TInput | undefined;
  sent: boolean;
};

const RESTATE_PROMISE_SENT = 'restate.promise.sent';
const RESTATE_PROMISE_RESOLVE = 'restate.promise.resolve';
const RESTATE_PROMISE_REJECT = 'restate.promise.reject';
const XSTATE_STOP = 'xstate.stop';

type PromiseCreator<TOutput, TInput extends NonReducibleUnknown> = ({input, ctx}: {
  input: TInput;
  ctx: restate.RpcContext,
}) => PromiseLike<TOutput>

export type PromiseActorLogic<TOutput, TInput = unknown> = ActorLogic<
  PromiseSnapshot<TOutput, TInput>,
  { type: string; [k: string]: unknown },
  TInput, // input
  AnyActorSystem
> & { sentinel: "restate.promise.actor", config: PromiseCreator<TOutput, TInput> };

export type PromiseActorRef<TOutput> = ActorRefFrom<
  PromiseActorLogic<TOutput, unknown>
>;

export function fromPromise<TOutput, TInput extends NonReducibleUnknown>(
  promiseCreator: PromiseCreator<TOutput, TInput>,
): PromiseActorLogic<TOutput, TInput> {
  const logic: PromiseActorLogic<TOutput, TInput> = {
    sentinel: "restate.promise.actor",
    config: promiseCreator,
    transition: (state, event) => {
      if (state.status !== 'active') {
        return state;
      }

      switch (event.type) {
        case RESTATE_PROMISE_SENT: {
          return {
            ...state,
            sent: true,
          };
        }
        case RESTATE_PROMISE_RESOLVE: {
          const resolvedValue = (event as any).data;
          return {
            ...state,
            status: 'done',
            output: resolvedValue,
            input: undefined
          };
        }
        case RESTATE_PROMISE_REJECT:
          return {
            ...state,
            status: 'error',
            error: (event as any).data,
            input: undefined
          };
        case XSTATE_STOP:
          return {
            ...state,
            status: 'stopped',
            input: undefined
          };
        default:
          return state;
      }
    },
    start: (state, {self, system}) => {
      if (state.status !== 'active') {
        return;
      }

      if (state.sent) {
        return;
      }

      const rs = (system as RestateActorSystem<any>)

      rs.ctx.send(rs.api.promise).invoke({
        systemName: rs.systemName,
        self: serialiseActorRef(self),
        src: self.src as string,
        input: state.input
      });

      // note that we sent off the promise so we don't do it again
      (system as any)._relay(self, self, {
        type: RESTATE_PROMISE_SENT,
      });
    },
    getInitialSnapshot: (_, input) => {
      return {
        status: 'active',
        output: undefined,
        error: undefined,
        input
      };
    },
    getPersistedSnapshot: (snapshot) => snapshot,
    restoreSnapshot: (snapshot: any) => snapshot
  };

  return logic;
}

export const promiseMethods = <TLogic extends AnyStateMachine>(path: string, logic: TLogic) => {
  const api = xStateApi(path)

  return {
    invoke: async (ctx: restate.RpcContext, {
      systemName,
      self,
      src,
      input
    }: { systemName: string, self: SerialisableActorRef, src: string, input: NonReducibleUnknown }) => {
      console.log("run promise with src", src, "in system", systemName, "with input", input)

      let actor: PromiseActorLogic<unknown, typeof input> | undefined
      try {
        actor = resolveReferencedActor(logic, src) as PromiseActorLogic<any>
      } catch (e) {
        throw new TerminalError(`Failed to resolve promise actor ${src}: ${e}`)
      }
      if (actor === undefined) {
        throw new TerminalError(`Couldn't find promise actor ${src}`)
      }

      if (actor.sentinel !== "restate.promise.actor") {
        throw new TerminalError("Found an actor we don't recognise")
      }

      const resolvedPromise = Promise.resolve(
        actor.config({input, ctx: ctx})
      );

      await resolvedPromise.then(
        (response) => {
          ctx.send(api.actor).send(systemName, {
            source: self,
            target: self,
            event: {
              type: RESTATE_PROMISE_RESOLVE,
              data: response
            }
          });
        },
        (errorData) => {
          ctx.send(api.actor).send(systemName, {
            source: self,
            target: self,
            event: {
              type: RESTATE_PROMISE_REJECT,
              data: errorData
            }
          });
        }
      );
    }
  }
}


export function resolveReferencedActor(machine: AnyStateMachine, src: string): AnyActorLogic | undefined {
  const match = src.match(/^xstate\.invoke\.(\d+)\.(.*)/)!;
  if (!match) {
    return machine.implementations.actors[src] as AnyActorLogic;
  }
  const [, indexStr, nodeId] = match;
  const node = machine.getStateNodeById(nodeId);
  const invokeConfig = node.config.invoke!;
  return (
    Array.isArray(invokeConfig)
      ? invokeConfig[indexStr as any]
      : (invokeConfig as InvokeConfig<any, any, any, any, any, any>)
  )?.src;
}
