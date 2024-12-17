# Event Processing Example: Transactional Handlers with Durable Side Effects and Timers

Processing events (from Kafka) to update various downstream systems.
- Durable side effects with retries and recovery of partial progress
- Events get sent to objects based on the Kafka key.
  For each key, Restate ensures that events are processed sequentially and in order.
  Slow events on other keys do not block processing (high fan-out, no head-of-line waiting).
- Ability to delay events when the downstream systems are busy, without blocking
  entire partitions.


## Running the example

1. Start the Kafka broker via Docker Compose: `docker compose up -d`.

2. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) with the Kafka broker configuration in a separate shell:
`restate-server --config-file restate.toml`

3. Start the service: `./gradlew run`

4. Register the example at Restate server by calling `restate -y deployment register localhost:9080`.

5. Let Restate subscribe to the Kafka topic `social-media-posts` and invoke `UserFeed/processPost` on each message.
```shell
curl localhost:9070/subscriptions -H 'content-type: application/json' \
-d '{
    "source": "kafka://my-cluster/social-media-posts",
    "sink": "service://UserFeed/processPost",
    "options": {"auto.offset.reset": "earliest"}
}'
```

## Demo scenario

Start a Kafka producer and send some messages to the `social-media-posts` topic:
```shell
docker exec -it broker kafka-console-producer --bootstrap-server broker:29092 --topic social-media-posts --property parse.key=true --property key.separator=:
```

Let's submit some posts for two different users:
```
userid1:{"content": "Hi! This is my first post!", "metadata": "public"}
userid2:{"content": "Hi! This is my first post!", "metadata": "public"}
userid1:{"content": "Hi! This is my second post!", "metadata": "public"}
```

Our Kafka broker only has a single partition so all these messages end up on the same partition.
You can see in the logs how events for different users are processed in parallel, but events for the same user are processed sequentially:

```shell
2024-12-17 18:07:43 INFO  [UserFeed/processPost][inv_13puWeoWJykN17cPZQm43rQZxiPr0qNmhP] my.example.utils.Stubs - Creating post 300dbd34-eae8-4875-8a71-c18b14e2aed7 for user userid1
2024-12-17 18:07:43 INFO  [UserFeed/processPost][inv_13puWeoWJykN17cPZQm43rQZxiPr0qNmhP] my.example.utils.Stubs - Content moderation for post 300dbd34-eae8-4875-8a71-c18b14e2aed7 is still pending... Will check again in 5 seconds
2024-12-17 18:07:46 INFO  [UserFeed/processPost][inv_1eZjTF0DbaEl3UzViEbqNPu6FZK4Y8KBAB] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-17 18:07:46 INFO  [UserFeed/processPost][inv_1eZjTF0DbaEl3UzViEbqNPu6FZK4Y8KBAB] my.example.utils.Stubs - Creating post 011443bb-a47d-43a0-8df4-d2c4ea50b3b8 for user userid2
2024-12-17 18:07:46 INFO  [UserFeed/processPost][inv_1eZjTF0DbaEl3UzViEbqNPu6FZK4Y8KBAB] my.example.utils.Stubs - Content moderation for post 011443bb-a47d-43a0-8df4-d2c4ea50b3b8 is still pending... Will check again in 5 seconds
2024-12-17 18:07:48 INFO  [UserFeed/processPost][inv_13puWeoWJykN17cPZQm43rQZxiPr0qNmhP] my.example.utils.Stubs - Content moderation for post 300dbd34-eae8-4875-8a71-c18b14e2aed7 is still pending... Will check again in 5 seconds
2024-12-17 18:07:56 INFO  [UserFeed/processPost][inv_1eZjTF0DbaEl3UzViEbqNPu6FZK4Y8KBAB] my.example.utils.Stubs - Content moderation for post 011443bb-a47d-43a0-8df4-d2c4ea50b3b8 is done
2024-12-17 18:07:56 INFO  [UserFeed/processPost][inv_1eZjTF0DbaEl3UzViEbqNPu6FZK4Y8KBAB] my.example.utils.Stubs - Updating user feed for user userid2 with post 011443bb-a47d-43a0-8df4-d2c4ea50b3b8
2024-12-17 18:07:56 INFO  [UserFeed/processPost][inv_1eZjTF0DbaEl3UzViEbqNPu6FZK4Y8KBAB] dev.restate.sdk.core.InvocationStateMachine - End invocation
2024-12-17 18:07:58 INFO  [UserFeed/processPost][inv_13puWeoWJykN17cPZQm43rQZxiPr0qNmhP] my.example.utils.Stubs - Content moderation for post 300dbd34-eae8-4875-8a71-c18b14e2aed7 is still pending... Will check again in 5 seconds
2024-12-17 18:09:03 INFO  [UserFeed/processPost][inv_13puWeoWJykN17cPZQm43rQZxiPr0qNmhP] my.example.utils.Stubs - Content moderation for post 300dbd34-eae8-4875-8a71-c18b14e2aed7 is still pending... Will check again in 5 seconds
2024-12-17 18:09:08 INFO  [UserFeed/processPost][inv_13puWeoWJykN17cPZQm43rQZxiPr0qNmhP] my.example.utils.Stubs - Content moderation for post 300dbd34-eae8-4875-8a71-c18b14e2aed7 is done
2024-12-17 18:09:08 INFO  [UserFeed/processPost][inv_13puWeoWJykN17cPZQm43rQZxiPr0qNmhP] my.example.utils.Stubs - Updating user feed for user userid1 with post 300dbd34-eae8-4875-8a71-c18b14e2aed7
2024-12-17 18:09:08 INFO  [UserFeed/processPost][inv_13puWeoWJykN17cPZQm43rQZxiPr0qNmhP] dev.restate.sdk.core.InvocationStateMachine - End invocation
2024-12-17 18:09:08 INFO  [UserFeed/processPost][inv_13puWeoWJykN0lJ761afYGoczigaKJDzWh] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-17 18:09:08 INFO  [UserFeed/processPost][inv_13puWeoWJykN0lJ761afYGoczigaKJDzWh] my.example.utils.Stubs - Creating post 738f0f12-8191-4702-bf49-59e1604ee799 for user userid1
2024-12-17 18:09:08 INFO  [UserFeed/processPost][inv_13puWeoWJykN0lJ761afYGoczigaKJDzWh] my.example.utils.Stubs - Content moderation for post 738f0f12-8191-4702-bf49-59e1604ee799 is still pending... Will check again in 5 seconds
2024-12-17 18:09:48 INFO  [UserFeed/processPost][inv_13puWeoWJykN0lJ761afYGoczigaKJDzWh] my.example.utils.Stubs - Content moderation for post 738f0f12-8191-4702-bf49-59e1604ee799 is done
2024-12-17 18:09:48 INFO  [UserFeed/processPost][inv_13puWeoWJykN0lJ761afYGoczigaKJDzWh] my.example.utils.Stubs - Updating user feed for user userid1 with post 738f0f12-8191-4702-bf49-59e1604ee799
2024-12-17 18:09:48 INFO  [UserFeed/processPost][inv_13puWeoWJykN0lJ761afYGoczigaKJDzWh] dev.restate.sdk.core.InvocationStateMachine - End invocation
```

As you see, slow events do not block other slow events.
Restate effectively created a queue per user ID.

The handler creates the social media post and waits for content moderation to finish.
If the moderation takes long, and there is an infrastructure crash, then Restate will trigger a retry. 
The handler will fast-forward to where it was, will recover the post ID and will continue waiting for moderation to finish.

You can try it out by killing Restate or the service halfway through processing a post.
