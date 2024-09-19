# Kafka-callback

An example of using Kafka to accept callbacks from external tasks

To run:
```bash
# start the docker containers, watching for changes
npm run app-dev
# once the containers are all up (kafka takes a little while), register the node services to Restate
restate dep register http://services:9080
# create the Kafka subscription
curl http://localhost:9070/subscriptions --json \
    '{"source": "kafka://main/callback-topic", "sink" : "service://consumer/process"}'
# kick off a workflow run
curl localhost:8080/publisher/myWorkflow/run
```
