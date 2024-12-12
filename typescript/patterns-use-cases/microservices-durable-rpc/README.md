# Microservices: Durable RPC

This example shows an example of:
- **Durable RPC** with exactly-once semantics
- **Requests with idempotency keys**: Ensuring that the same request is processed only once



## Running the Example

Run Restate locally (`npx restate-server`).

Run the Restate service: `cd restate-app && npm run app`

Register the service: `npx restate deployments register http://localhost:5000`

Run the Express service: `cd express-app && npm run app`

Send a request to the Express service:
```
curl -X POST localhost:5000/reserve/12345/abcde
```