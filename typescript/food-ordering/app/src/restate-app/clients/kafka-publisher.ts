import * as restate from "@restatedev/restate-sdk";
import { Location } from "../types/types";
import { Kafka, KafkaConfig } from "kafkajs";

const KAFKA_BOOTSTRAP_SERVERS = process.env.KAFKA_BOOTSTRAP_SERVERS || "localhost:9092";
const KAFKA_CONFIG: KafkaConfig = { brokers: [KAFKA_BOOTSTRAP_SERVERS] };
const KAFKA_TOPIC = "driver-updates";

export class KafkaPublisher {

  private readonly kafka = new Kafka(KAFKA_CONFIG);
  private readonly producer = this.kafka.producer();
  private connected = false;

  public async send(_ctx: restate.RpcContext, driverId: string, location: Location) {
    if (!this.connected) {
      console.info("Connecting Kafka producer");
      await this.producer.connect();
      this.connected = true;
    }

    await this.producer.send({
      topic: KAFKA_TOPIC,
      messages: [{key: driverId, value: JSON.stringify(location)}],
    });
  }
}

export function getPublisher(): KafkaPublisher {
    return new KafkaPublisher();
}
