# Microservices: Durable RPC

This example shows an example of:
- **Durable RPC**: once a request has reached Restate, it is guaranteed to be processed
- **Exactly-once processing**: Ensure that duplicate requests are not processed multiple times via idempotency keys

The example shows how you can programmatically submit a requests to a Restate service.
Every request gets processed durably, and deduplicated based on the idempotency key.

The example shows an [Express service](express-app/app.ts) that receives reservation requests and forwards them to the product service.
The [Product service](restate-app/app.ts) is a Restate service that durably processes the reservation requests and deduplicates them.
Each product can be reserved only once.

## Running the Example

Run Restate locally (`npx restate-server`).

Run the Restate service: `cd restate-app && npm run app`

Register the service: `npx restate deployments register http://localhost:9080`

Run the Express service: `cd express-app && npm run app`

## Demo scenario

Send a request to the Express service and try to reserve a product:
```
curl -X POST localhost:5000/reserve/product1/reservation1
```

This will give us `{"reserved":true}`.

Let's change the reservation ID and run the request again:
```
curl -X POST localhost:5000/reserve/product1/reservation2
```

This will give us `{"reserved":false}` because this product is already reserved, so we can't reserve it again.

However, if we run the first request again with same reservation ID, we will get `{"reserved":true}` again:
```shell
curl -X POST localhost:5000/reserve/product1/reservation1
``` 
Restate deduplicated the request and returned the first response.

