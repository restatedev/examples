import {
  ActorLogic,
  ActorRefFrom,
  AnyActorLogic,
  AnyActorRef,
  AnyStateMachine,
  InvokeConfig,
  NonReducibleUnknown,
  Snapshot,
} from "xstate";
import { AnyActorSystem } from "xstate/dist/declarations/src/system";
import {
  RestateActorSystem,
  SerialisableActorRef,
  serialiseActorRef,
  xStateApi,
} from "./lib";
import * as restate from "@restatedev/restate-sdk";
import { TerminalError } from "@restatedev/restate-sdk";

export type PromiseSnapshot<TOutput, TInput> = Snapshot<TOutput> & {
  input: TInput | undefined;
  sent: boolean;
};

const RESTATE_PROMISE_SENT = "restate.promise.sent";
const RESTATE_PROMISE_RESOLVE = "restate.promise.resolve";
const RESTATE_PROMISE_REJECT = "restate.promise.reject";
const XSTATE_STOP = "xstate.stop";

type PromiseCreator<TOutput, TInput extends NonReducibleUnknown> = ({
  input,
  ctx,
}: {
  input: TInput;
  ctx: restate.Context;
}) => PromiseLike<TOutput>;

export type PromiseActorLogic<TOutput, TInput = unknown> = ActorLogic<
  PromiseSnapshot<TOutput, TInput>,
  { type: string; [k: string]: unknown },
  TInput, // input
  AnyActorSystem
> & {
  sentinel: "restate.promise.actor";
  config: PromiseCreator<TOutput, TInput>;
};

export type PromiseActorRef<TOutput> = ActorRefFrom<
  PromiseActorLogic<TOutput, unknown>
>;

export function fromPromise<P extends string, TOutput, TInput extends NonReducibleUnknown>(
  promiseCreator: PromiseCreator<TOutput, TInput>
): PromiseActorLogic<TOutput, TInput> {
  const logic: PromiseActorLogic<TOutput, TInput> = {
    sentinel: "restate.promise.actor",
    config: promiseCreator,
    transition: (state, event) => {
      if (state.status !== "active") {
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
            status: "done",
            output: resolvedValue,
            input: undefined,
          };
        }
        case RESTATE_PROMISE_REJECT:
          return {
            ...state,
            status: "error",
            error: (event as any).data,
            input: undefined,
          };
        case XSTATE_STOP:
          return {
            ...state,
            status: "stopped",
            input: undefined,
          };
        default:
          return state;
      }
    },
    start: (state, { self, system }) => {
      if (state.status !== "active") {
        return;
      }

      if (state.sent) {
        return;
      }

      const rs = system as RestateActorSystem<any>;

      rs.ctx.serviceSendClient(rs.api.promise).invoke({
        systemName: rs.systemName,
        self: serialiseActorRef(self),
        srcs: actorSrc(self),
        input: state.input,
      });

      // note that we sent off the promise so we don't do it again
      (system as any)._relay(self, self, {
        type: RESTATE_PROMISE_SENT,
      });
    },
    getInitialSnapshot: (_, input) => {
      return {
        status: "active",
        output: undefined,
        error: undefined,
        input,
        sent: false,
      };
    },
    getPersistedSnapshot: (snapshot) => snapshot,
    restoreSnapshot: (snapshot: any) => snapshot,
  };

  return logic;
}

function actorSrc(actor?: AnyActorRef): string[] {
  if (actor === undefined) {
    return [];
  }
  if (typeof actor.src !== "string") {
    return [];
  }
  return [actor.src, ...actorSrc(actor._parent)];
}

export const promiseService = <TLogic extends AnyStateMachine>(
  path: string,
  logic: TLogic
) => {
  const api = xStateApi(path);

  return restate.service({
    name: `${path}.promises`,
    handlers: {
      invoke: async (
        ctx: restate.Context,
        {
          systemName,
          self,
          srcs,
          input,
        }: {
          systemName: string;
          self: SerialisableActorRef;
          srcs: string[];
          input: NonReducibleUnknown;
        }
      ) => {
        console.log(
          "run promise with srcs",
          srcs,
          "in system",
          systemName,
          "with input",
          input
        );

        const [promiseSrc, ...machineSrcs] = srcs;

        let stateMachine: AnyStateMachine = logic;
        for (const src of machineSrcs) {
          let maybeSM;
          try {
            maybeSM = resolveReferencedActor(stateMachine, src);
          } catch (e) {
            throw new TerminalError(
              `Failed to resolve promise actor ${src}: ${e}`
            );
          }
          if (maybeSM === undefined) {
            throw new TerminalError(
              `Couldn't find state machine actor with src ${src}`
            );
          }
          if ("implementations" in maybeSM) {
            stateMachine = maybeSM as AnyStateMachine;
          } else {
            throw new TerminalError(
              `Couldn't recognise machine actor with src ${src}`
            );
          }
        }

        let promiseActor: PromiseActorLogic<any> | undefined;
        let maybePA;
        try {
          maybePA = resolveReferencedActor(stateMachine, promiseSrc);
        } catch (e) {
          throw new TerminalError(
            `Failed to resolve promise actor ${promiseSrc}: ${e}`
          );
        }
        if (maybePA === undefined) {
          throw new TerminalError(
            `Couldn't find promise actor with src ${promiseSrc}`
          );
        }
        if (
          "sentinel" in maybePA &&
          maybePA.sentinel === "restate.promise.actor"
        ) {
          promiseActor = maybePA as PromiseActorLogic<any>;
        } else {
          throw new TerminalError(
            `Couldn't recognise promise actor with src ${promiseSrc}`
          );
        }

        const resolvedPromise = Promise.resolve(
          promiseActor.config({ input, ctx })
        );

        await resolvedPromise.then(
          (response) => {
            ctx.objectSendClient(api.actor, systemName).send({
              source: self,
              target: self,
              event: {
                type: RESTATE_PROMISE_RESOLVE,
                data: response,
              },
            });
          },
          (errorData) => {
            ctx.objectSendClient(api.actor, systemName).send({
              source: self,
              target: self,
              event: {
                type: RESTATE_PROMISE_REJECT,
                data: errorData,
              },
            });
          }
        );
      },
    },
  })
};

export function resolveReferencedActor(
  machine: AnyStateMachine,
  src: string
): AnyActorLogic | undefined {
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
      : (invokeConfig as InvokeConfig<any, any, any, any, any, any, any, any>)
  )?.src;
}
