# Restate + Java + Spring + Maven

Build the project with Maven:

```bash
mvn clean install
```


Run with Docker compose:

```bash
docker compose up
```

Send a request:

```bash
curl localhost:8080/Greeter/greet -H 'content-type: application/json' -d '"Hi"'
```

