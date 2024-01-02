import {
  Actor,
  ActorLogicFrom,
  ActorOptions,
  ActorSystem,
  ActorSystemInfo,
  AnyActorRef,
  AnyEventObject,
  AnyStateMachine,
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
import {
  AreAllImplementationsAssumedToBeProvided,
  MissingImplementationsError
} from "xstate/dist/declarations/src/typegenTypes";

export interface RestateActorSystem<T extends ActorSystemInfo> extends ActorSystem<T> {
  _bookId: () => string;
  _register: (sessionId: string, actorRef: AnyActorRef) => string;
  _unregister: (actorRef: AnyActorRef) => void;
  _sendInspectionEvent: (
    event: HomomorphicOmit<InspectionEvent, 'rootId'>
  ) => void;
  actor: (sessionId: string) => AnyActorRef | undefined,
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
  uuid: string;
}

async function createSystem<T extends ActorSystemInfo>(ctx: restate.RpcContext, api: XStateApi<ActorLogicFrom<T>>, systemName: string): Promise<RestateActorSystem<T>> {
  const events = await ctx.get<{ [key: string]: SerialisableScheduledEvent }>("events") ?? {}
  const childrenByID = await ctx.get<{ [key: string]: SerialisableActorRef }>("children") ?? {}

  let idCounter = 0;
  const children = new Map<string, AnyActorRef>();
  const keyedActors = new Map<keyof T['actors'], AnyActorRef | undefined>();
  const reverseKeyedActors = new WeakMap<AnyActorRef, keyof T['actors']>();
  const observers = new Set<Observer<InspectionEvent>>();

  const scheduler = {
    schedule(_source: AnyActorRef, _target: AnyActorRef, event: EventObject, delay: number, id: string | undefined): void {
      if (id === undefined) {
        id = ctx.rand.random().toString(36).slice(2)
      }

      const {source, target} = {source: serialiseActorRef(_source), target: serialiseActorRef(_target)}

      console.log("schedule from", source.id, "to", target.id, "with id", id, "and delay", delay)

      const scheduledEvent: SerialisableScheduledEvent = {
        source,
        target,
        event,
        delay,
        id,
        startedAt: Date.now(),
        uuid: ctx.rand.uuidv4(),
      };
      const scheduledEventId = createScheduledEventId(source, id);
      if (scheduledEventId in events) {
        console.log("Ignoring duplicated schedule from", source.id, "to", target.id)
        return
      }

      events[scheduledEventId] = scheduledEvent;

      ctx.sendDelayed(api.actor, delay).send(systemName, {scheduledEvent, source, target, event})
      ctx.set("events", events)
    },
    cancel(source: AnyActorRef, id: string): void {
      console.log("cancel schedule from", source.id, "with id", id)

      const scheduledEventId = createScheduledEventId(source, id);

      delete events[scheduledEventId];
      ctx.set("events", events)
    },
    cancelAll(actorRef: AnyActorRef): void {
      console.log("cancel all for", actorRef.id)

      for (const scheduledEventId in events) {
        const scheduledEvent = events[scheduledEventId];
        if (scheduledEvent.source.sessionId === actorRef.sessionId) {
          delete events[scheduledEventId];
        }
      }
      ctx.set("events", events)
    },
  }

  const system: RestateActorSystem<T> = {
    ctx,
    api,
    systemName,

    _bookId: () => ctx.rand.uuidv4(),
    _register: (sessionId, actorRef) => {
      if (actorRef.id in childrenByID) {
        // rehydration case; ensure session ID maintains continuity
        sessionId = childrenByID[actorRef.id].sessionId
        actorRef.sessionId = sessionId
      } else {
        // new actor case
        childrenByID[actorRef.id] = serialiseActorRef(actorRef)
        ctx.set("children", childrenByID)
      }
      console.log("register", sessionId, actorRef.id)
      children.set(sessionId, actorRef);
      return sessionId;
    },
    _unregister: (actorRef) => {
      if (actorRef.id in childrenByID) {
        // rehydration case; ensure session ID maintains continuity
        actorRef.sessionId = childrenByID[actorRef.id].sessionId
      }

      children.delete(actorRef.sessionId);
      delete childrenByID[actorRef.id]
      ctx.set("children", childrenByID)
      const systemId = reverseKeyedActors.get(actorRef);

      if (systemId !== undefined) {
        keyedActors.delete(systemId);
        reverseKeyedActors.delete(actorRef);
      }
    },
    _sendInspectionEvent: (event) => {
      const resolvedInspectionEvent: InspectionEvent = {
        ...event,
        rootId: "root",
      };
      observers.forEach((observer) => observer.next?.(resolvedInspectionEvent));
    },
    actor: (sessionId) => {
      return children.get(sessionId)
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
      console.log("Relaying message from", source?.id, "to", target.id, ":", event.type);
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

export async function createActor<TLogic extends AnyStateMachine>(ctx: restate.RpcContext, api: XStateApi<TLogic>, systemName: string, logic: TLogic extends AnyStateMachine ? AreAllImplementationsAssumedToBeProvided<TLogic['__TResolvedTypesMeta']> extends true ? TLogic : MissingImplementationsError<TLogic['__TResolvedTypesMeta']> : TLogic, options?: ActorOptions<TLogic>): Promise<Actor<TLogic>> {
  const system = await createSystem(ctx, api, systemName)
  const snapshot = await ctx.get<Snapshot<unknown>>("snapshot") ?? undefined;

  const parent: FakeParent<TLogic> = {
    id: "fakeRoot",
    sessionId: "fakeRoot",
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
    src: "fakeRoot",
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

  return createXActor(logic, {id: "root", ...options, parent, snapshot} as any);
}

const actorMethods = <TLogic extends AnyStateMachine>(path: string, logic: TLogic) => {
  const api = xStateApi(path)

  return {
    create: async (ctx: restate.RpcContext, systemName: string, request?: { input?: InputFrom<TLogic> }): Promise<Snapshot<unknown>> => {
      ctx.clear("snapshot")
      ctx.clear("events")
      ctx.clear("children")

      const root = (await createActor(ctx, api, systemName, logic, {
        input: request?.input,
      })).start();

      ctx.set("snapshot", root.getPersistedSnapshot())

      return root.getPersistedSnapshot()
    },
    send: async (ctx: restate.RpcContext, systemName: string, request?: { scheduledEvent?: SerialisableScheduledEvent, source?: SerialisableActorRef, target?: SerialisableActorRef, event: AnyEventObject }): Promise<Snapshot<unknown> | undefined> => {
      if (!request) {
        throw new TerminalError("Must provide a request")
      }

      if (request.scheduledEvent) {
        const events = await ctx.get<{ [key: string]: SerialisableScheduledEvent }>("events") ?? {}
        const scheduledEventId = createScheduledEventId(request.scheduledEvent.source, request.scheduledEvent.id)
        if (!(scheduledEventId in events)) {
          console.log("Received now cancelled event", scheduledEventId, "for target", request.target)
          return
        }
        if (events[scheduledEventId].uuid !== request.scheduledEvent.uuid) {
          console.log("Received now replaced event", scheduledEventId, "for target", request.target)
          return
        }
        delete events[scheduledEventId]
        ctx.set("events", events)
      }

      const root = (await createActor(ctx, api, systemName, logic)).start();


      let actor;
      if (request.target) {
        actor = (root.system as RestateActorSystem<any>).actor(request.target.sessionId)
        if (!actor) {
          throw new TerminalError(`Actor ${request.target.id} not found; it may have since stopped`)
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
      const root = (await createActor(ctx, api, systemName, logic));

      return root.getPersistedSnapshot()
    },
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
type XStateApi<TLogic extends AnyStateMachine> = { actor: restate.ServiceApi<ActorRouter<TLogic>>, promise: restate.ServiceApi<PromiseRouter<TLogic>> }

function createScheduledEventId(
  actorRef: SerialisableActorRef,
  id: string
): string {
  return `${actorRef.sessionId}.${id}`;
}

