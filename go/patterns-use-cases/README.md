


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

6. Start a Kafka producer and send some messages to the `social-media-posts` topic:
    ```shell
    docker exec -it broker kafka-console-producer --bootstrap-server broker:29092 --topic social-media-posts --property parse.key=true --property key.separator=:
    ```

7. Submit some posts for two different users:
    ```
    userid1:{"content": "Hi! This is my first post!", "metadata": "public"}
    userid2:{"content": "Hi! This is my first post!", "metadata": "public"}
    userid1:{"content": "Hi! This is my second post!", "metadata": "public"}
    ```

8. Our Kafka broker only has a single partition so all these messages end up on the same partition.
  You can see in the logs how events for different users are processed in parallel, but events for the same user are processed sequentially:
    
    <details>
    <summary>Logs</summary>
    
    ```
    2025/01/03 16:33:16 INFO Handling invocation method=UserFeed/ProcessPost invocationID=inv_13puWeoWJykN2iR3HzJOiyzymCA9yPbT1f
    Created post 3dae1f20-a7e5-4f3f-8113-3a4b91e48e72 for user userid1 with content: Hi! This is my first post!
    Content moderation for post 3dae1f20-a7e5-4f3f-8113-3a4b91e48e72 is still pending... Will check again in 5 seconds
    2025/01/03 16:33:19 INFO Handling invocation method=UserFeed/ProcessPost invocationID=inv_1eZjTF0DbaEl2J2i6fbVKbMmbeHAjPGBe9
    Created post c4672199-7a06-4540-8bf7-a5ec15327346 for user userid2 with content: Hi! This is my first post!
    Content moderation for post c4672199-7a06-4540-8bf7-a5ec15327346 is still pending... Will check again in 5 seconds
    Content moderation for post 3dae1f20-a7e5-4f3f-8113-3a4b91e48e72 is still pending... Will check again in 5 seconds
    Content moderation for post c4672199-7a06-4540-8bf7-a5ec15327346 is done
    Updating the user feed for user userid2 with post c4672199-7a06-4540-8bf7-a5ec15327346
    2025/01/03 16:33:24 INFO Invocation completed successfully method=UserFeed/ProcessPost invocationID=inv_1eZjTF0DbaEl2J2i6fbVKbMmbeHAjPGBe9
    2025/01/03 16:33:24 INFO Handling invocation method=UserFeed/ProcessPost invocationID=inv_1eZjTF0DbaEl5vwb9ckycf7xsj0c5wWo0h
    Created post ede539a3-0c53-4d4b-a93e-8fdef3330de6 for user userid2 with content: Hi! This is my first post!
    Content moderation for post ede539a3-0c53-4d4b-a93e-8fdef3330de6 is still pending... Will check again in 5 seconds
    Content moderation for post 3dae1f20-a7e5-4f3f-8113-3a4b91e48e72 is done
    Updating the user feed for user userid1 with post 3dae1f20-a7e5-4f3f-8113-3a4b91e48e72
    2025/01/03 16:33:32 INFO Invocation completed successfully method=UserFeed/ProcessPost invocationID=inv_13puWeoWJykN2iR3HzJOiyzymCA9yPbT1f
    2025/01/03 16:33:32 INFO Handling invocation method=UserFeed/ProcessPost invocationID=inv_13puWeoWJykN6neIyklfqzeQVAun6OI6hb
    Created post a31a5ebb-1e19-4629-a7ae-b1e80bb469ec for user userid1 with content: Hi! This is my first post!
    Content moderation for post a31a5ebb-1e19-4629-a7ae-b1e80bb469ec is still pending... Will check again in 5 seconds
    Content moderation for post ede539a3-0c53-4d4b-a93e-8fdef3330de6 is still pending... Will check again in 5 seconds
    Content moderation for post ede539a3-0c53-4d4b-a93e-8fdef3330de6 is done
    Updating the user feed for user userid2 with post ede539a3-0c53-4d4b-a93e-8fdef3330de6
    2025/01/03 16:33:44 INFO Invocation completed successfully method=UserFeed/ProcessPost invocationID=inv_1eZjTF0DbaEl5vwb9ckycf7xsj0c5wWo0h
    Content moderation for post a31a5ebb-1e19-4629-a7ae-b1e80bb469ec is still pending... Will check again in 5 seconds
    Content moderation for post a31a5ebb-1e19-4629-a7ae-b1e80bb469ec is done
    Updating the user feed for user userid1 with post a31a5ebb-1e19-4629-a7ae-b1e80bb469ec
    2025/01/03 16:33:52 INFO Invocation completed successfully method=UserFeed/ProcessPost invocationID=inv_13puWeoWJykN6neIyklfqzeQVAun6OI6hb
    2025/01/03 16:33:52 INFO Handling invocation method=UserFeed/ProcessPost invocationID=inv_13puWeoWJykN4MGP7mftRXvTi5JIWKSJbP
    Created post 7da58f9a-4af4-4a35-94b0-90879a20390d for user userid1 with content: Hi! This is my second post!
    Content moderation for post 7da58f9a-4af4-4a35-94b0-90879a20390d is still pending... Will check again in 5 seconds
    Content moderation for post 7da58f9a-4af4-4a35-94b0-90879a20390d is still pending... Will check again in 5 seconds
    Content moderation for post 7da58f9a-4af4-4a35-94b0-90879a20390d is done
    Updating the user feed for user userid1 with post 7da58f9a-4af4-4a35-94b0-90879a20390d
    2025/01/03 16:34:02 INFO Invocation completed successfully method=UserFeed/ProcessPost invocationID=inv_13puWeoWJykN4MGP7mftRXvTi5JIWKSJbP
    2025/01/03 16:34:02 INFO Handling invocation method=UserFeed/ProcessPost invocationID=inv_13puWeoWJykN6C0ovGVJ4Bvrhxhw9Lnpx7
    Created post b8c0d187-1148-41d2-9060-d25fe0d9bdfe for user userid1 with content: Hi! This is my second post!
    Content moderation for post b8c0d187-1148-41d2-9060-d25fe0d9bdfe is still pending... Will check again in 5 seconds
    Content moderation for post b8c0d187-1148-41d2-9060-d25fe0d9bdfe is still pending... Will check again in 5 seconds
    Content moderation for post b8c0d187-1148-41d2-9060-d25fe0d9bdfe is done
    Updating the user feed for user userid1 with post b8c0d187-1148-41d2-9060-d25fe0d9bdfe
    2025/01/03 16:34:37 INFO Invocation completed successfully method=UserFeed/ProcessPost invocationID=inv_13puWeoWJykN6C0ovGVJ4Bvrhxhw9Lnpx7
    ```
    
    As you see, slow events do not block other slow events. Restate effectively created a queue per user ID.
    
    The handler creates the social media post and waits for content moderation to finish.
    If the moderation takes long, and there is an infrastructure crash, then Restate will trigger a retry.
    The handler will fast-forward to where it was, will recover the post ID and will continue waiting for moderation to finish.
    
    You can try it out by killing Restate or the service halfway through processing a post.
    
    </details>


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

6. Register a new package via the RPC handler:
    ```shell
    curl localhost:8080/PackageTracker/package123/RegisterPackage \
      -H 'content-type: application/json' -d '{"finalDestination": "Bridge 6, Amsterdam"}'
    ```

7. Start a Kafka producer and publish some messages to update the location of the package on the `package-location-updates` topic:
    ```shell
    docker exec -it broker kafka-console-producer --bootstrap-server broker:29092 --topic package-location-updates --property parse.key=true --property key.separator=:
    ```
    Send messages like
    ```
    package123:{"timestamp": "2024-10-10 13:00", "location": "Pinetree Road 5, Paris"}
    package123:{"timestamp": "2024-10-10 14:00", "location": "Mountain Road 155, Brussels"}
    ```

8. Query the package location via the RPC handler:
    ```shell
    curl localhost:8080/PackageTracker/package123/getPackageInfo
    ```
    or via the CLI: `restate kv get PackageTracker package123`
    
    You can see how the state was enriched by the initial RPC event and the subsequent Kafka events:
   
    <details>
    <summary>Output</summary>
   
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
   
    </details>