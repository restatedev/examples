import {
  Actor, ActorLogicFrom,
  ActorOptions,
  ActorSystem,
  ActorSystemInfo,
  AnyActorLogic,
  AnyActorRef,
  AnyEventObject, AnyStateMachine,
  createActor as createXActor,
  EventFromLogic,
  EventObject,
  HomomorphicOmit,
  InputFrom,
  InspectionEvent,
  InteropSubscribable,
  Observer,
  Snapshot,
  Subscription,
  toObserver
} from "xstate";
import * as restate from "@restatedev/restate-sdk";
import {TerminalError} from "@restatedev/restate-sdk";
import {promiseMethods} from "./promise";

export interface RestateActorSystem<T extends ActorSystemInfo> extends ActorSystem<T> {
  _bookId: () => string;
  _register: (sessionId: string, actorRef: AnyActorRef) => string;
  _unregister: (actorRef: AnyActorRef) => void;
  _sendInspectionEvent: (
    event: HomomorphicOmit<InspectionEvent, 'rootId'>
  ) => void;
  actorByID: (id: string) => AnyActorRef | undefined,
  _set: <K extends keyof T['actors']>(key: K, actorRef: T['actors'][K]) => void;
  _relay: (
    source: AnyActorRef | SerialisableActorRef | undefined,
    target: AnyActorRef,
    event: AnyEventObject
  ) => void;
  api: XStateApi<ActorLogicFrom<T>>
  ctx: restate.RpcContext,
  systemName: string,
}

export type SerialisableActorRef = {
  id: string;
  sessionId: string;
  _parent?: SerialisableActorRef,
}

export const serialiseActorRef = (actorRef: AnyActorRef): SerialisableActorRef => {
  return {
    id: actorRef.id,
    sessionId: actorRef.sessionId,
    _parent: actorRef._parent === undefined ? undefined : serialiseActorRef(actorRef._parent)
  }
}

type SerialisableScheduledEvent = {
  id: string;
  event: EventObject;
  startedAt: number;
  delay: number;
  source: SerialisableActorRef;
  target: SerialisableActorRef;
}

function createSystem<T extends ActorSystemInfo>(ctx: restate.RpcContext, api: XStateApi<ActorLogicFrom<T>>, systemName: string): RestateActorSystem<T> {
  let idCounter = 0;
  const children = new Map<string, AnyActorRef>();
  const childrenByID = new Map<string, AnyActorRef>();
  const keyedActors = new Map<keyof T['actors'], AnyActorRef | undefined>();
  const reverseKeyedActors = new WeakMap<AnyActorRef, keyof T['actors']>();
  const observers = new Set<Observer<InspectionEvent>>();

  const scheduler = {
    schedule(source: AnyActorRef, target: AnyActorRef, event: EventObject, delay: number, id: string | undefined): void {
      ctx.send(api.actor).schedule(systemName, {
        source: serialiseActorRef(source),
        target: serialiseActorRef(target),
        event,
        delay,
        id
      })
    },
    cancel(source: AnyActorRef, id: string): void {
      ctx.send(api.actor).cancel(systemName, {
        source: serialiseActorRef(source),
        id
      })
    },
    cancelAll(actorRef: AnyActorRef): void {
      ctx.send(api.actor).cancelAll(systemName, {
        actorRef: serialiseActorRef(actorRef),
      })
    },
  }

  const system: RestateActorSystem<T> = {
    ctx,
    api,
    systemName,

    _bookId: () => `x:${idCounter++}`,
    _register: (sessionId, actorRef) => {
      children.set(sessionId, actorRef);
      childrenByID.set(actorRef.id, actorRef);
      return sessionId;
    },
    _unregister: (actorRef) => {
      children.delete(actorRef.sessionId);
      childrenByID.delete(actorRef.id);
      const systemId = reverseKeyedActors.get(actorRef);

      if (systemId !== undefined) {
        keyedActors.delete(systemId);
        reverseKeyedActors.delete(actorRef);
      }
    },
    _sendInspectionEvent: (event) => {
      const resolvedInspectionEvent: InspectionEvent = {
        ...event,
        rootId: "x:0",
      };
      observers.forEach((observer) => observer.next?.(resolvedInspectionEvent));
    },
    actorByID: (id) => {
      return childrenByID.get(id)
    },
    get: (systemId) => {
      return keyedActors.get(systemId) as T['actors'][any];
    },
    _set: (systemId, actorRef) => {
      const existing = keyedActors.get(systemId);
      if (existing && existing !== actorRef) {
        throw new Error(
          `Actor with system ID '${systemId as string}' already exists.`
        );
      }

      keyedActors.set(systemId, actorRef);
      reverseKeyedActors.set(actorRef, systemId);
    },
    inspect: (observer) => {
      observers.add(observer);
    },
    _relay: (source, target, event) => {
      console.log("Relaying message from", source?.id, "to", target.id, ":", event);
      (target as any)._send(event);
    },
    scheduler,
    getSnapshot: () => {
      return {
        _scheduledEvents: {} // unused
      };
    },
    start: () => {
    }
  };

  return system;
}

interface FakeParent<TLogic extends AnyStateMachine> extends AnyActorRef {
  _send: (event: EventFromLogic<TLogic>) => void;
}

export async function createActor<TLogic extends AnyStateMachine>(ctx: restate.RpcContext, api: XStateApi<TLogic>, systemName: string, logic: TLogic, options?: ActorOptions<TLogic>): Promise<Actor<TLogic>> {
  const system = createSystem(ctx, api, systemName)

  const parent: FakeParent<TLogic> = {
    id: "fakeRoot",
    sessionId: "",
    send: () => {
    },
    _send: () => {
    },
    start: () => {
    },
    getSnapshot: (): null => {
      return null
    }, // TODO
    getPersistedSnapshot: (): Snapshot<unknown> => {
      return {
        status: 'active',
        output: undefined,
        error: undefined,
      }
    }, // TODO
    stop: () => {
    }, // TODO
    system,
    src: "root",
    subscribe: (): Subscription => {
      return {
        unsubscribe() {
        }
      }
    },
    [Symbol.observable]: (): InteropSubscribable<any> => {
      return {
        subscribe(): Subscription {
          return {
            unsubscribe() {
            }
          }
        }
      }
    },
  }

  if (options?.inspect) {
    // Always inspect at the system-level
    system.inspect(toObserver(options.inspect));
  }

  return createXActor(logic as any, {...options, parent} as any);
}

const actorMethods = <TLogic extends AnyStateMachine>(path: string, logic: TLogic) => {
  const api = xStateApi(path)

  return {
    create: async (ctx: restate.RpcContext, systemName: string, request?: { input?: InputFrom<TLogic> }): Promise<Snapshot<unknown>> => {

      const root = (await createActor(ctx, api, systemName, logic, {
        input: request?.input,
      })).start();

      ctx.set("snapshot", root.getPersistedSnapshot())

      return root.getPersistedSnapshot()
    },
    send: async (ctx: restate.RpcContext, systemName: string, request?: { scheduledEventId?: ScheduledEventId, source?: SerialisableActorRef, target?: SerialisableActorRef, event: EventFromLogic<TLogic> }): Promise<Snapshot<unknown> | undefined> => {
      if (!request) {
        throw new TerminalError("Must provide a request")
      }

      const snapshot = await ctx.get<Snapshot<unknown>>("snapshot") ?? undefined;

      if (request.scheduledEventId) {
        const events = await ctx.get<{ [key: ScheduledEventId]: SerialisableScheduledEvent }>("events") ?? {}
        if (!(request.scheduledEventId in events)) {
          console.log("Received now cancelled event", request.scheduledEventId, "for target", request.target)
          return
        }
        delete events[request.scheduledEventId]
        ctx.set("events", events)
      }

      const root = (await createActor(ctx, api, systemName, logic, {
        snapshot,
      })).start();


      let actor;
      if (request.target) {
        actor = (root.system as RestateActorSystem<any>).actorByID(request.target.id)
        if (!actor) {
          throw new TerminalError(`Actor ${request.target.id} not found`)
        }
      } else {
        actor = root
      }

      (root.system as RestateActorSystem<any>)._relay(request.source, actor, request.event)

      const nextSnapshot = root.getPersistedSnapshot()
      ctx.set("snapshot", nextSnapshot)

      return nextSnapshot
    },
    snapshot: async (ctx: restate.RpcContext, systemName: string): Promise<Snapshot<unknown>> => {
      const snapshot = await ctx.get<Snapshot<unknown>>("snapshot") ?? undefined;

      const root = (await createActor(ctx, api, systemName, logic, {
        snapshot,
      }));

      return root.getPersistedSnapshot()
    },
    schedule: async (ctx: restate.RpcContext, system: string, {source, target, event, delay, id}: {
                       source: SerialisableActorRef,
                       target: SerialisableActorRef,
                       event: EventObject,
                       delay: number,
                       id?: string,
                     }
    ) => {
      if (id === undefined) {
        id = ctx.rand.random().toString(36).slice(2)
      }

      // TODO check for existing id here?

      console.log("schedule from", source.id, "to", target.id, "with id", id, "and delay", delay)

      const events = await ctx.get<{ [key: ScheduledEventId]: SerialisableScheduledEvent }>("events") ?? {}

      const scheduledEvent: SerialisableScheduledEvent = {
        source,
        target,
        event,
        delay,
        id,
        startedAt: Date.now()
      };
      const scheduledEventId = createScheduledEventId(source, id);
      events[scheduledEventId] = scheduledEvent;

      ctx.sendDelayed(api.actor, delay).send(system, {scheduledEventId, target, event})
      ctx.set("events", events)
    },
    cancel: async (ctx: restate.RpcContext, system: string, {
      source,
      id
    }: { source: SerialisableActorRef, id: string }) => {
      console.log("cancel schedule from", source.id, "with id", id)

      const events = await ctx.get<{ [key: ScheduledEventId]: SerialisableScheduledEvent }>("events") ?? {}

      const scheduledEventId = createScheduledEventId(source, id);

      delete events[scheduledEventId];
      ctx.set("events", events)
    },
    cancelAll: async (ctx: restate.RpcContext, system: string, {actorRef}: { actorRef: SerialisableActorRef }) => {
      console.log("cancel all for", actorRef.id)

      const events = await ctx.get<{ [key: ScheduledEventId]: SerialisableScheduledEvent }>("events") ?? {}
      for (const scheduledEventId in events) {
        const scheduledEvent =
          events[
            scheduledEventId as ScheduledEventId
            ];
        if (scheduledEvent.source === actorRef) {
          delete events[scheduledEventId as ScheduledEventId];
        }
      }
      ctx.set("events", events)
    }
  }
}

export const bindXStateRouter = <
  TLogic extends AnyStateMachine,
>(server: restate.RestateServer, path: string, logic: TLogic): restate.RestateServer => {
  return server
    .bindKeyedRouter(path, restate.keyedRouter(actorMethods(path, logic)))
    .bindRouter(`${path}.promises`, restate.router(promiseMethods(path, logic)))
}

export const xStateApi = <TLogic extends AnyStateMachine>(path: string): XStateApi<TLogic> => {
  const actor: restate.ServiceApi<ActorRouter<TLogic>> = {path}
  const promise: restate.ServiceApi<PromiseRouter<TLogic>> = {path: `${path}.promises`}
  return {actor, promise}
}

type ActorRouter<TLogic extends AnyStateMachine> = restate.KeyedRouter<ReturnType<typeof actorMethods<TLogic>>>
type PromiseRouter<TLogic extends AnyStateMachine> = restate.UnKeyedRouter<ReturnType<typeof promiseMethods<TLogic>>>
type XStateApi<TLogic extends AnyStateMachine> = {actor: restate.ServiceApi<ActorRouter<TLogic>>, promise: restate.ServiceApi<PromiseRouter<TLogic>>}

type ScheduledEventId = string & { __scheduledEventId: never };

function createScheduledEventId(
  actorRef: SerialisableActorRef,
  id: string
): ScheduledEventId {
  return `${actorRef.sessionId}.${id}` as ScheduledEventId;
}

