# Restate with Java, Spring, and Spring JPA

This example shows how to use Restate together with Spring. 
The example implements a product service which sits in front of a Postgres database and reads and writes to it with Spring JPA. 

You can use this example as a template for getting started with Restate and Spring.

## Running the example

Start postgres:

```shell
docker run -d \
-p 5432:5432 \
-e POSTGRES_USER=compose-postgres \
-e POSTGRES_PASSWORD=compose-postgres \
-v $(pwd)/postgresql:/docker-entrypoint-initdb.d \
postgres:15.0-alpine
```

This will start a Postgres instance with a `Product` table with some products in it. 

[Start Restate](https://docs.restate.dev/develop/local_dev):

```shell
restate-server
```

Start the application:
```shell
./gradlew run
```

Register the service via the [CLI](https://docs.restate.dev/develop/local_dev):
```shell
restate deployments register localhost:9080
```

Try to reserve some product1 by calling the reserve handler of the ProductService: 

```shell
curl -X POST localhost:8080/ProductService/product1/reserve
```

Check how many items are left in stock:

```shell
curl -X POST localhost:8080/ProductService/product1/getProductInformation
```

Try to reserve some more products. 




