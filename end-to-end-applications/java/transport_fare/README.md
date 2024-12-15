# Hello world - Java HTTP example


### Add Kafka subscription

```shell
curl localhost:9070/subscriptions --json '{
   "source": "kafka://my-cluster/badgein",
   "sink": "service://CardTracker/badgeIn",
   "options": {"auto.offset.reset": "latest"}
}'

curl localhost:9070/subscriptions --json '{
   "source": "kafka://my-cluster/badgeout",
   "sink": "service://CardTracker/badgeOut",
   "options": {"auto.offset.reset": "latest"}
}'
```

```shell
echo 'card-321:"Liverpool Street"' | kafka-console-producer --bootstrap-server localhost:9092 --topic badgein --property "parse.key=true" --property "key.separator=:"

echo 'card-31:"Baker Street"' | kafka-console-producer --bootstrap-server localhost:9092 --topic badgeout --property "parse.key=true" --property "key.separator=:"
```
