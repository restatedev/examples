# Event Processing Example: Event Enrichment

Processing events (from Kafka) to update various downstream systems.
- Durable side effects with retries and recovery of partial progress
- Events get sent to objects based on the Kafka key. 
  For each key, Restate ensures that events are processed sequentially and in order. 
  Slow events on other keys do not block processing (high fan-out, no head-of-line waiting). 
- Ability to delay events when the downstream systems are busy, without blocking
  entire partitions.

  
## Running the example

1. Make sure you have installed the dependencies: `npm install`.

2. Start the Kafka broker via Docker Compose: `docker compose up -d`.

3. Start Restate Server with the Kafka broker configuration in a separate shell: `npx restate-server --config-file restate.toml`

4. Start the data upload service: `npm run app-dev`

5. Register the example at Restate server by calling `npx restate -y deployment register "localhost:9080"`.

6. Let Restate subscribe to the Kafka topic `user-updates` and invoke `userUpdates/updateUserEvent` on each message.
```shell
curl localhost:9070/subscriptions -H 'content-type: application/json' \
-d '{
    "source": "kafka://my-cluster/user-updates",
    "sink": "service://userUpdates/updateUserEvent",
    "options": {"auto.offset.reset": "earliest"}
}'
```

## Demo scenario

Start a Kafka producer and send some messages to the `user-updates` topic:
```shell
docker exec -it broker kafka-console-producer --bootstrap-server broker:29092 --topic user-updates --property parse.key=true --property key.separator=:
```
Send messages like
```
userid1:{"profile": "dev", "permissions": "all", "resources": "all"}
userid2:{"profile": "dev", "permissions": "all", "resources": "all"}
```

Our Kafka broker only has a single partition so all these messages end up on the same partition. 

You can see in the logs how multiple events get processed in parallel. 
Processing can take long, but slow events do not block other slow events.
Restate effectively created a queue per user ID.  

The handler tries to update the user profile in a downstream system.
If the downstream system is busy, the event gets delayed and retried later.
The retries and timers are tracked and managed resiliently by Restate.

