# Food ordering example: How to integrate with external services by using Awakeables and side effects

This example demonstrates how you can integrate [Restate](https://restate.dev) with external services by using Awakeables and side effects.

The example application implements an order processing middleware which sits between food delivery providers and restaurants.
Delivery providers interact with the application by calling the Restate `OrderService`.
The `OrderService` interacts with the restaurants' external point of sale service to dispatch the orders.

![Example diagrams.png](./img/arch.png)

The example illustrates the following aspects:

- How you can use Restate's side effects to make synchronous calls to external services.
- How you can use Awakeables to connect Restate handlers with asynchronous external services.
- How to resolve Awakeables from an external service and thereby resuming Restate invocations.
- How delayed calls can be used to schedule tasks for later moments in time.

## Download the example

```shell
EXAMPLE=typescript-food-ordering; wget https://github.com/restatedev/examples/releases/latest/download/$EXAMPLE.zip && unzip $EXAMPLE.zip -d $EXAMPLE && rm $EXAMPLE.zip
```

## Detailed description

This application implements the order processing middleware that sits between food delivery providers and restaurants.
Delivery providers forward orders to the Restate application via API requests (CreateOrder / CancelOrder / PrepareOrder).
The Restate services process the order and forward it to the appropriate point-of-sale (restaurant handling the order).

The app is implemented as a single keyed service that is keyed by `orderId`` and maintains the state machine of that order (i.e. the status of the order) as state in Restate.

When an order is created a workflow is executed to check if the restaurant is open.
If this is the case then the order is accepted and gets created in the point of sales system of the restaurant.
The workflow becomes just another gRPC method that can be called and retried.
It calls the point of sales software of the restaurants as side effects and saves the state of the workflow in Restate.

### Delayed calls

Customers can schedule an order for later on (deliveryDelay).
This is implemented via Restate's delayed calls that schedule the preparation of the order to take place at the desired time.
This delayed call is persisted in Restate.
Restate ensures that it happens, and takes care of retries to prevent lost orders and unhappy customers.

Have a look at the implementation of the `createOrder` function in the OrderService in `services/src/order_service.ts`.

### Awakeables

When the order needs to be prepared, the `OrderService` creates an awakeable (persistent promise) and sends the awakeable ID together with the preparation request to the point of sales API of the restaurant.
The preparation is an asynchronous operation during which the workflow is paused.
Once the restaurant has finished the preparation, it resolves the awakeable to resume the `OrderService`.
The `OrderService` then notifies the delivery provider that they should send a driver to the restaurant.

Have a look at the implementation of the `prepareOrder` function in the ` OrderService`` in  `services/src/order_service.ts`.

## Running this example

- Latest stable version of [NodeJS](https://nodejs.org/en/) >= v18.17.1 and [npm CLI](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm) >= 9.6.7 installed.
- [Docker Engine](https://docs.docker.com/engine/install/) to launch the Restate runtime (not needed for the app implementation itself).
- Optional: Docker Compose

## Deployment with Docker Compose

Build the services:

```shell
docker build ./services/ -t dev.local/food-ordering/services:0.0.1 && \
docker build ./pos_server/ -t dev.local/food-ordering/pos_server:0.0.1
```

Launch the Docker compose setup:

```shell
docker compose up
```

### Send requests to the service

Create a new order for five cheeseburgers at `FastFood123` with immediate delivery

You can do this via curl:

```shell
curl -X POST http://localhost:8080/OrderService/createOrder -H 'content-type: application/json' -d '{
  "key": "134",
  "request": {"restaurantId": "FastFood123", "deliveryDelay": 0, "items": [{"productName": "cheeseburger", "quantity": 5}]}
}'
```

Create a new order for five cheeseburgers at `FastFood123` with delivery delayed for 10 seconds:

```shell
curl -X POST http://localhost:8080/OrderService/createOrder -H 'content-type: application/json' -d '{
  "key": "174",
  "request": {"restaurantId": "FastFood123", "deliveryDelay": 10000, "items": [{"productName": "cheeseburger", "quantity": 5}]}
}'
```

You can also check the status of the delivery via:

```shell
curl -X POST http://localhost:8080/OrderService/getOrderStatus -H 'content-type: application/json' -d '{ "key": "174" }'
```

To understand the requests that are done, you can have a look at the logs of the runtime, service and PoS server.
For the delayed order request, you will see the late order being scheduled for preparation after 10 seconds.

## Running locally

### Run the services

Install the dependencies and build the application:

```shell
cd services
npm install && npm run build
```

Run the application with:

```shell
npm run app
```

### Run the point of sales server

In another terminal session, run the point of sales server.

Install the dependencies and build the application:

```shell
cd pos_server
npm install && npm run build
```

Run the application with:

```shell
npm run app
```

### Start the Restate runtime

Now [launch the runtime](../../README.md#launching-the-runtime) and [discover the services](../../README.md#connect-runtime-and-services).

Now you can send requests to the application as described [here](README.md#send-requests-to-the-service).

## Releasing

### Upgrading Typescript SDK

Upgrade the `@restatedev/restate-sdk` version as described [here](../../README.md#upgrading-the-sdk-dependency-for-restate-developers).
