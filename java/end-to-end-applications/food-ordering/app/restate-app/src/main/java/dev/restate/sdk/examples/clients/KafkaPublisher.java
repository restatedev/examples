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

package dev.restate.sdk.examples.clients;

import java.util.Properties;
import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.ByteArraySerializer;
import org.apache.kafka.common.serialization.StringSerializer;

public class KafkaPublisher {

  public static final String KAFKA_BOOTSTRAP_SERVERS =
      System.getenv("KAFKA_BOOTSTRAP_SERVERS") != null
          ? System.getenv("KAFKA_BOOTSTRAP_SERVERS")
          : "127.0.0.1:9092";

  private final KafkaProducer<String, byte[]> producer;

  public KafkaPublisher() {
    this.producer = new KafkaProducer<>(properties());
  }

  public static Properties properties() {
    Properties properties = new Properties();
    properties.setProperty(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG, KAFKA_BOOTSTRAP_SERVERS);
    properties.setProperty(
        ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
    properties.setProperty(
        ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, ByteArraySerializer.class.getName());
    return properties;
  }

  public void sendDriverUpdate(String key, byte[] value) {
    producer.send(new ProducerRecord<>("driver-updates", key, value));
  }
}
