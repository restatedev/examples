# Event Processing Example: Event Enrichment 

This example shows an example of:
- **Event enrichment** over different sources: RPC and Kafka
- **Stateful actors / Digital twins** updated over Kafka
- **Streaming join**
- Populating state from events and making it queryable via RPC handlers.

The example implements a package delivery tracking service. 
Packages are registered via an RPC handler, and their location is updated via Kafka events.
The Package Tracker Virtual Object tracks the package details and its location history.

## Running the example

1. Make sure you have installed the dependencies: `npm install`.

2. Start the Kafka broker via Docker Compose: `docker compose up -d`.

3. Start Restate Server with the Kafka broker configuration in a separate shell: `npx restate-server --config-file restate.toml`

4. Start the data upload service: `npm run app-dev`

5. Register the example at Restate server by calling
   `npx restate -y deployment register "localhost:9080"`.

6. Let Restate subscribe to the Kafka topic `package-location-updates` and invoke `package-tracker/updateLocation` on each message.
```shell
curl localhost:9070/subscriptions -H 'content-type: application/json' \
-d '{
    "source": "kafka://my-cluster/package-location-updates",
    "sink": "service://package-tracker/updateLocation",
    "options": {"auto.offset.reset": "earliest"}
}'
```

## Demo scenario

1. Register a new package via the RPC handler:
```shell
curl localhost:8080/package-tracker/package1/registerPackage \
  -H 'content-type: application/json' -d '{"finalDestination": "Bridge 6, Amsterdam"}'
```

2. Start a Kafka producer and send some messages to update the location of the package on the `package-location-updates` topic:
```shell
docker exec -it broker kafka-console-producer --bootstrap-server broker:29092 --topic package-location-updates --property parse.key=true --property key.separator=:
```
Send messages like 
```
package1:{"timestamp": "2024-10-10 13:00", "location": "Pinetree Road 5, Paris"}
package1:{"timestamp": "2024-10-10 14:00", "location": "Mountain Road 155, Brussels"}
```

3. Query the package location via the RPC handler:
```shell
curl localhost:8080/package-tracker/package1/getLocation
```
or via the CLI: `npx restate kv get package-tracker package1`

You can see how the state was enriched by the initial RPC event and the subsequent Kafka events:
```
🤖 State:
―――――――――
                          
 Service  package-tracker 
 Key      package1        

 KEY      VALUE                                            
 details  {                                                
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