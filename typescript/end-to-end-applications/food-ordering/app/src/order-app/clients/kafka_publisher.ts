/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate examples,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */

import { Location } from "../types/types";
import { Kafka, KafkaConfig } from "kafkajs";

const KAFKA_BOOTSTRAP_SERVERS = process.env.KAFKA_BOOTSTRAP_SERVERS || "localhost:9092";
const KAFKA_CONFIG: KafkaConfig = { brokers: [KAFKA_BOOTSTRAP_SERVERS] };
const KAFKA_TOPIC = "driver-updates";

export class Kafka_publisher {
  private readonly kafka = new Kafka(KAFKA_CONFIG);
  private readonly producer = this.kafka.producer();
  private connected = false;

  public async send(driverId: string, location: Location) {
    if (!this.connected) {
      console.info("Connecting Kafka producer");
      await this.producer.connect();
      this.connected = true;
    }

    await this.producer.send({
      topic: KAFKA_TOPIC,
      messages: [{ key: driverId, value: JSON.stringify(location) }],
    });
  }
}

export function getPublisher(): Kafka_publisher {
  return new Kafka_publisher();
}
