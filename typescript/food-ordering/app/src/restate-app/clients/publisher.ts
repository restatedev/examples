import * as restate from "@restatedev/restate-sdk";
import { service as driverservice } from "../services/driver";
import { Location } from "../types/types";
import { Kafka, KafkaConfig } from "kafkajs";

const KAFKA_BOOTSTRAP_SERVERS = process.env.KAFKA_BOOTSTRAP_SERVERS || "localhost:9092";
const KAFKA_CONFIG: KafkaConfig = { brokers: [KAFKA_BOOTSTRAP_SERVERS] };
const KAFKA_TOPIC = "driver-updates";

export const isKafkaEnabled = process.env.ENABLE_KAFKA !== "false";

export interface DriverUpdatesPublisher {
  send(ctx: restate.RpcContext, driverId: string, location: Location): Promise<void>;
}

class KafkaPublisher implements DriverUpdatesPublisher {

  private readonly kafka = new Kafka(KAFKA_CONFIG);
  private readonly producer = this.kafka.producer();
  private connected = false;

  public async send(_ctx: restate.RpcContext, driverId: string, location: Location) {
    if (!this.connected) {
      console.info("Connecting Kafka producer");
      await this.producer.connect();
      this.connected = true;
    }

    this.producer.send({
        topic: KAFKA_TOPIC,
        messages: [{ key: driverId, value: JSON.stringify(location) }],
      });
  }
}

class RestatePublisher implements DriverUpdatesPublisher {
  public async send(ctx: restate.RpcContext, driverId: string, location: Location) {
    ctx.send(driverservice).updateCoordinate(driverId, location);
  }
}

export function getPublisher(): DriverUpdatesPublisher {
  if (isKafkaEnabled) {
    return new KafkaPublisher();
  } else {
    return new RestatePublisher();
  }
}
