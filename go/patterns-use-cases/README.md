



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

5. Let Restate subscribe to the Kafka topic `package-location-updates` and invoke `package-tracker/updateLocation` on each message.
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