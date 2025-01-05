# Updating and Accessing Databases

This set of examples shows various patterns to access databases from Restate handlers.

The basic premise is:

1. You don't need to do anything special, you can just interact with
   your database the same way as from other microservices or workflow activities.

2. But you can use Restate's state, journal, and concurrency mechanisms
   as helpers to improve common access problems, solve race conditions,
   or avoid inconsistencies in the presence of retries, concurrent requests,
   or zombie processes.

The code in [main.ts](./src/main.ts) walks gradually through those patterns and explains
them with inline comments.

### Running the Example

_This is purely opional, the example code and comments document the behavior well._
_Running the example can be interesting, though, if you want to play with specific failure_
_scenarios, like pausing/killing processes at specific points and observe the behavior._

**Sample Postgres Instance**

To run this example, you need a PostgreSQL database that the Restate handlers will
access/modify. Simply start one using this Docker command (from the example directory,
i.e., the directory containing this README file!).

```shell
docker run -it --rm \
  --name restate_example_db \
  -e POSTGRES_USER=restatedb \
  -e POSTGRES_PASSWORD=restatedb \
  -e POSTGRES_DB=exampledb \
  -p 5432:5432 \
  -v "$(pwd)/database:/docker-entrypoint-initdb.d" \
  postgres:15.0-alpine
```

In a separate shell, you can check the contents of the database via those queries
(requires `psql` to be installed):
```shell
psql postgresql://restatedb:restatedb@localhost:5432/exampledb -c 'SELECT * FROM users;'
psql postgresql://restatedb:restatedb@localhost:5432/exampledb -c 'SELECT * FROM user_idempotency;'
```

**Running Example Code**

Start Restate Server, start the app service (`npm run example`) and register the service (running on port 9080).

See the [root README](/restatedev/examples/tree/main?tab=readme-ov-file#running-the-examples) for details.

**Example Commands**

The below commands trigger the individual example handlers in the different services.

As with all Restate invocations, you can add idempotency keys to the invoking HTTP calls to make sure
retries from HTTP clients are de-duplicated by Restate.
Add an idempotency-key header by appending `-H 'idempotency-key: <mykey>'` to any command, for example: `curl -i localhost:8080/keyed/A/updateConditional --json '12' -H 'idempotency-key: abcdef'`.
As with all Restate handlers, if you invoke them from within another Restate handler via the Context, invocations are automatically made idempotent.

Simple DB operations:
* Simple read: `curl -i localhost:8080/simple/read --json '"A"'`
* Durable read: `curl -i localhost:8080/simple/durableRead --json '"B"'`
* Insert: `curl -i localhost:8080/simple/insert  --json '{ "userId": "C", "name": "Emm", "address": "55, Rue du Faubourg Saint-Honoré, 75008 Paris, France", "credits": 1337 }'`
* Update: `curl -i localhost:8080/simple/update  --json '{ "userId": "A", "newName": "Donald" }'`

Keyed DB Operations:
* Update simple: `curl -i localhost:8080/keyed/B/update --json '12'`
* Update exactly-once: `curl -i localhost:8080/keyed/B/updateConditional --json '12'`


Idempotency update:
* Updating exactly-once: `curl -i localhost:8080/idempotency/update --json '{ "userId": "A", "addCredits": 100 }'`


