import json
import os

from kafka import KafkaProducer
from kafka.errors import KafkaError

KAFKA_BOOTSTRAP_SERVERS = os.environ.get("KAFKA_BOOTSTRAP_SERVERS") or "localhost:9092"
KAFKA_TOPIC = "driver-updates"

producer = KafkaProducer(
    bootstrap_servers=[KAFKA_BOOTSTRAP_SERVERS],
    key_serializer=lambda m: m.encode("utf-8"),
    value_serializer=lambda m: json.dumps(m).encode("utf-8"),
)


def send_location_to_kafka(driver_id: str, location: dict):
    future = producer.send(KAFKA_TOPIC, key=driver_id, value=location)
    try:
        record_metadata = future.get(timeout=10)
    except KafkaError as e:
        print(f"Failed to send location update for driver {driver_id}: {e}")
    else:
        print(
            f"Successfully sent location update for driver {driver_id} to {record_metadata.topic}"
        )
