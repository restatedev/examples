# Subway Fare Calculator

This example shows a subway fare calculator written in Java with the Restate SDK. 

When a passenger takes the subway, he badges in at the start station and out at the end station.
Based on that, the system calculates the trip fare. 

The system also keeps track of how much the passenger has spent in total on the ongoing day.  
Whenever the amount exceeds that of a day ticket, the system will charge a day ticket instead.

 What does the example show?
- **Join** events from different Kafka topics: badge in and badge out.
- **Stateful actors** that get invoked by Kafka events, execute lightweight durable functions and interact with Restate's KV store.
  We track the total amount spent by a passenger and the current trip.
- **Durable delayed actions**: schedule tasks for later on and Restate makes sure they execute. Here we close trips at the end of the day.
- **Durable side effects**: execute and retry payments. Persist successfully executed payments.
- Slow retry loops (of minutes) **don't block processing** for events of other keys.
- This can **run anywhere**. Also on a serverless/FaaS platform like AWS Lambda.

Have a look at the [CardTracker](./src/main/java/dev/restate/example/CardTracker.java) service to see how the system is implemented.

## Download the example

- Via the CLI:
    ```shell
    restate example java-subway-fare-calculator && cd java-subway-fare-calculator
    ```

- Via git clone:
    ```shell
    git clone git@github.com:restatedev/examples.git
    cd examples/java/end-to-end-applications/subway-fare-calculator
    ```

- Via `wget`:
    ```shell
   wget https://github.com/restatedev/examples/releases/latest/download/java-subway-fare-calculator.zip && unzip java-subway-fare-calculator.zip -d java-subway-fare-calculator && rm java-subway-fare-calculator.zip
    ```

## Running the example

1. Start the Kafka broker via Docker Compose: `docker compose up -d`.
2. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) with the Kafka broker configuration in a separate shell: `restate-server --config-file restate.toml`
3. Start the service: `./gradlew run`
4. Register the service: `restate -y deployments register localhost:9080`
5. Let Restate subscribe to the Kafka topic `badgein` and `badgeout` and respectively the `badgeIn` and `badgeOut` handlers of the `CardTracker` service: 
    ```shell
    curl localhost:9070/subscriptions -H 'content-type: application/json' -d '{
    "source": "kafka://my-cluster/badgein",
    "sink": "service://CardTracker/badgeIn",
    "options": {"auto.offset.reset": "latest"}
    }'
    
    curl localhost:9070/subscriptions -H 'content-type: application/json' -d '{
    "source": "kafka://my-cluster/badgeout",
    "sink": "service://CardTracker/badgeOut",
    "options": {"auto.offset.reset": "latest"}
    }'
    ```

Badge in by creating a Kafka producer:
```shell
docker exec -ti broker kafka-console-producer --bootstrap-server localhost:9092 --topic badgein --property parse.key=true --property key.separator=:
```
And send the message: 
```shell
card-321:"Liverpool Street"
```

Later on badge out, by creating a Kafka producer in another terminal for the `badgeout` topic:
```shell
docker exec -ti broker kafka-console-producer --bootstrap-server localhost:9092 --topic badgeout --property parse.key=true --property key.separator=:
```
And send the message:
```shell
card-321:"Baker Street"
```

Play around by sending some more requests. You can check the current K/V state via the CLI:
```shell
restate kv get CardTracker card-321
```

As you badge in and out, the system will calculate the fare and the total amount spent by the passenger.
Once the total amount spent exceeds the day ticket price, the system will charge a day ticket instead.