# Event Processing Example: Transactional Handlers with Durable Side Effects and Timers

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

6. Let Restate subscribe to the Kafka topic `social-media-posts` and invoke `userFeed/processPost` on each message.
```shell
curl localhost:9070/subscriptions -H 'content-type: application/json' \
-d '{
    "source": "kafka://my-cluster/social-media-posts",
    "sink": "service://userFeed/processPost",
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
Created post fd74fc81-2f8b-457a-aca3-2f297643ea54 for user userid1 with content: Hi! This is my first post!
Created post b0b6d057-0ec2-4a52-9942-81b675eae7c5 for user userid2 with content: Hi! This is my first post!
Content moderation for post fd74fc81-2f8b-457a-aca3-2f297643ea54 is still pending... Will check again in 5 seconds
Content moderation for post b0b6d057-0ec2-4a52-9942-81b675eae7c5 is done
Updating the user feed for user userid2 and post b0b6d057-0ec2-4a52-9942-81b675eae7c5
Content moderation for post fd74fc81-2f8b-457a-aca3-2f297643ea54 is still pending... Will check again in 5 seconds
Content moderation for post fd74fc81-2f8b-457a-aca3-2f297643ea54 is still pending... Will check again in 5 seconds
Content moderation for post fd74fc81-2f8b-457a-aca3-2f297643ea54 is done
Updating the user feed for user userid1 and post fd74fc81-2f8b-457a-aca3-2f297643ea54
Created post a05b134c-e7f6-4dcf-9cf2-e66faef49bde for user userid1 with content: Hi! This is my second post!
Content moderation for post a05b134c-e7f6-4dcf-9cf2-e66faef49bde is still pending... Will check again in 5 seconds
Content moderation for post a05b134c-e7f6-4dcf-9cf2-e66faef49bde is done
Updating the user feed for user userid1 and post a05b134c-e7f6-4dcf-9cf2-e66faef49bde
```

As you see, slow events do not block other slow events.
Restate effectively created a queue per user ID.

The handler creates the social media post and waits for content moderation to finish.
If the moderation takes long, and there is an infrastructure crash, then Restate will not recreate the post but will recover the post ID and will continue waiting for moderation to finish.
You can try it out by killing Restate or the service halfway through processing a post.
The retries and timers are tracked and managed resiliently by Restate.

