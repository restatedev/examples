


## Event Processing: Transactional Handlers with Durable Side Effects and Timers

Processing events (from Kafka) to update various downstream systems.
- Durable side effects with retries and recovery of partial progress
- Events get sent to objects based on the Kafka key.
  For each key, Restate ensures that events are processed sequentially and in order.
  Slow events on other keys do not block processing (high fan-out, no head-of-line waiting).
- Ability to delay events when the downstream systems are busy, without blocking
  entire partitions.


### Running the example

1. Start the Kafka broker via Docker Compose: `docker compose up -d`.

2. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) with the Kafka broker configuration in a separate shell: `restate-server --config-file restate.toml`

3. Start the service: `go run ./src/eventtransactions`

4. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

5. Let Restate subscribe to the Kafka topic `social-media-posts` and invoke `UserFeed/ProcessPost` on each message.
```shell
curl localhost:9070/subscriptions -H 'content-type: application/json' \
-d '{
    "source": "kafka://my-cluster/social-media-posts",
    "sink": "service://UserFeed/ProcessPost",
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
If the moderation takes long, and there is an infrastructure crash, then Restate will trigger a retry.
The handler will fast-forward to where it was, will recover the post ID and will continue waiting for moderation to finish.

You can try it out by killing Restate or the service halfway through processing a post.


## Event Processing: Event Enrichment

This example shows an example of:
- **Event enrichment** over different sources: RPC and Kafka
- **Stateful actors / Digital twins** updated over Kafka
- **Streaming join**
- Populating state from events and making it queryable via RPC handlers.

The example implements a package delivery tracking service.
Packages are registered via an RPC handler, and their location is updated via Kafka events.
The Package Tracker Virtual Object tracks the package details and its location history.

### Running the example

1. Start the Kafka broker via Docker Compose: `docker compose up -d`.

2. Start Restate Server with the Kafka broker configuration in a separate shell: `restate-server --config-file restate.toml`

3. Start the service: `go run ./src/eventenrichment`

4. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080`

5. Let Restate subscribe to the Kafka topic `package-location-updates` and invoke `PackageTracker/UpdateLocation` on each message.
```shell
curl localhost:9070/subscriptions -H 'content-type: application/json' \
-d '{
    "source": "kafka://my-cluster/package-location-updates",
    "sink": "service://PackageTracker/UpdateLocation",
    "options": {"auto.offset.reset": "earliest"}
}'
```


### Demo scenario


1. Register a new package via the RPC handler:
```shell
curl localhost:8080/PackageTracker/package123/RegisterPackage \
  -H 'content-type: application/json' -d '{"finalDestination": "Bridge 6, Amsterdam"}'
```

2. Start a Kafka producer and publish some messages to update the location of the package on the `package-location-updates` topic:
```shell
docker exec -it broker kafka-console-producer --bootstrap-server broker:29092 --topic package-location-updates --property parse.key=true --property key.separator=:
```
Send messages like
```
package123:{"timestamp": "2024-10-10 13:00", "location": "Pinetree Road 5, Paris"}
package123:{"timestamp": "2024-10-10 14:00", "location": "Mountain Road 155, Brussels"}
```

3. Query the package location via the RPC handler:
```shell
curl localhost:8080/PackageTracker/package123/getPackageInfo
```
or via the CLI: `restate kv get PackageTracker package123`

You can see how the state was enriched by the initial RPC event and the subsequent Kafka events:
```
🤖 State:
―――――――――
                          
 Service  package-tracker 
 Key      package123       

 KEY           VALUE                                            
 package-info  {                                                
                  "finalDestination": "Bridge 6, Amsterdam",  
                  "locations": [                                 
                    {                                            
                      "location": "Pinetree Road 5, Paris",      
                      "timestamp": "2024-10-10 13:00"            
                    },                                            
                    {                                            
                      "location": "Mountain Road 155, Brussels", 
                      "timestamp": "2024-10-10 14:00"            
                    }                                            
                  ]                                              
                }  
```