# Serverless food ordering app with Restate

The code in this repo was used for:
- Current 2023 presentation
- Blog post on serverless

The app logic (order workflow) discussed in the presentation and blog post can be found under: `app/src/services/order_service.ts`.

## Running locally

Build the Docker containers:
```shell
./scripts/build_containers
```

Launch the Docker compose setup:
```shell
docker compose up
```

WebUI is running at http://localhost:3000

Jaeger is running at http://localhost:16686

Clean up after bringing setup down:
```shell
docker compose rm 
```

## Running on AWS Lambda

Build the Docker containers:
```shell
./scripts/build_containers
```

Launch the Docker compose setup with all services except for the order workflow app:
```shell
docker compose -f docker-compose-lambda.yml up
```

Deploy the order workflow service and order status service on Lambda:
1. Build the zip file
 
    npm run bundle

2. Deploy the handler on Lambda, by following the steps in the [Lambda documentation](https://docs.restate.dev/services/deployment/lambda#deploying-the-lambda-function-via-the-aws-console)

3. Once the Lambda services are registered in Restate, you can create the Kafka subscription:

      scripts/create_subscription

Now you can order products via the UI on localhost:3000 and see them trigger the Lambda order workflow. 

Clean up after bringing setup down:
```shell
docker compose rm -f docker-compose-lambda.yml
```

## Other scripts

Once you have a running setup you can 
- Inspect order status state: `scripts/watch_order_status`
- Inspect state: `scripts/watch_state`
- Inspect invocation status of runninf invocations: `scripts/watch_status`


