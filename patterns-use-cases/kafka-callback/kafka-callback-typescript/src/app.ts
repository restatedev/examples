import * as restate from "@restatedev/restate-sdk";
import { Kafka } from "kafkajs";

const kafka = new Kafka({
  clientId: "publisher",
  brokers: ["kafka:9092"],
});

const producer = kafka.producer({ allowAutoTopicCreation: true });
await producer.connect();

type Event = {
  correlationID: string;
};

// In practice, this workflow probably isn't the producer; it likely calls to some external task
// that produces an event when complete, where we perhaps can't control the Kafka key or the payload
// to be a workflow ID or awakeable ID, but we have some correlating ID.
const publisher = restate.workflow({
  name: "publisher",
  handlers: {
    run: async (ctx: restate.WorkflowContext) => {
      const correlationID = ctx.rand.uuidv4();
      const kafkaKey = ctx.rand.uuidv4();

      ctx.console.log(
        `Producing an event with correlationID: ${correlationID} and kafka key: ${kafkaKey}`,
      );

      const event: Event = {
        correlationID,
      };

      const awakeable = ctx.awakeable<Event>();

      await ctx
        .objectClient<Callbacks>({ name: "callbacks" }, event.correlationID)
        .register(awakeable.id);

      await ctx.run(() =>
        producer.send({
          topic: "callback-topic",
          messages: [
            {
              key: kafkaKey,
              value: JSON.stringify(event),
            },
          ],
        }),
      );

      const foundEvent = await awakeable.promise;
      const matches = foundEvent.correlationID === event.correlationID;
      console.log(
        `Received callback via kafka with correlationID ${foundEvent.correlationID} (${matches ? "matches" : "does not match"})`,
      );

      return { matches };
    },
  },
});

type CallbackState = {
  awakeableID: string;
};

// we use a simple virtual object to correlate arbitrary IDs with awakeable IDs
const callbacks = restate.object({
  name: "callbacks",
  handlers: {
    register: async (
      ctx: restate.ObjectContext<CallbackState>,
      awakeableID: string,
    ) => {
      ctx.console.log(
        `Registering awakeableID ${awakeableID} against correlationID ${ctx.key}`,
      );
      ctx.set("awakeableID", awakeableID);
    },

    resolve: async (
      ctx: restate.ObjectContext<CallbackState>,
      payload?: unknown,
    ) => {
      const awakeableID = await ctx.get("awakeableID");
      if (awakeableID === null) return;

      ctx.console.log(
        `Resolving awakeableID ${awakeableID} from correlationID ${ctx.key}`,
      );
      ctx.resolveAwakeable(awakeableID, payload);
      ctx.clear("awakeableID");
    },

    reject: async (
      ctx: restate.ObjectContext<CallbackState>,
      reason: string,
    ) => {
      const awakeableID = await ctx.get("awakeableID");
      if (awakeableID === null) return;

      ctx.console.log(
        `Rejecting awakeableID ${awakeableID} from correlationID ${ctx.key}`,
      );
      ctx.rejectAwakeable(awakeableID, reason);
      ctx.clear("awakeableID");
    },
  },
});

type Callbacks = typeof callbacks;

// We use a virtual object as the consumer so that Kafka keys are processed in sequence
const consumer = restate.object({
  name: "consumer",
  handlers: {
    process: async (ctx: restate.ObjectContext, event: Event) => {
      ctx.console.log(
        `Processing event with kafka key: ${ctx.key} and correlationID: ${event.correlationID}`,
      );

      await ctx
        .objectClient<Callbacks>({ name: "callbacks" }, event.correlationID)
        .resolve(event);
    },
  },
});

// Create the Restate server to accept requests
restate.endpoint().bind(publisher).bind(callbacks).bind(consumer).listen(9080);
