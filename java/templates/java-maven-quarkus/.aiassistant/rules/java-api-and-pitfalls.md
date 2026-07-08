---
apply: by model decision
instructions: Java SDK API reference and common pitfalls for Restate durable services
---

# Java SDK Reference: API and Pitfalls

## Setup

### Install Restate Server

Ask the user for preferred installation method:

**Homebrew:**
```bash
brew install restatedev/tap/restate-server
```

**Docker:**
```bash
docker run --name restate_dev --rm -p 8080:8080 -p 9070:9070 docker.io/restatedev/restate
```

### Install Restate CLI

```bash
brew install restatedev/tap/restate
```

Or Docker:
```bash
docker run -it docker.restate.dev/restatedev/restate-cli:latest invocations ls
```

### Install SDK

**Gradle (build.gradle.kts):**
```kt
// For deploying as HTTP service
implementation("dev.restate:sdk-java-http:2.9.0")
// Or for deploying using AWS Lambda
implementation("dev.restate:sdk-java-lambda:2.9.0")
```

**Maven**: 
```xml Java/Maven
<properties>
    <restate.version>2.9.0</restate.version>
</properties>
<dependencies>
    <!-- For deploying as HTTP service -->
    <dependency>
        <groupId>dev.restate</groupId>
        <artifactId>sdk-java-http</artifactId>
        <version>${restate.version}</version>
    </dependency>
    <!-- Or for deploying using AWS Lambda -->
    <dependency>
        <groupId>dev.restate</groupId>
        <artifactId>sdk-java-lambda</artifactId>
        <version>${restate.version}</version>
    </dependency>
</dependencies>
```

On JDK 23+, pass `--enable-native-access=ALL-UNNAMED` as a JVM argument (or set `Enable-Native-Access: ALL-UNNAMED` in the JAR manifest) to silence the native-access warning printed at startup.

### Minimal Scaffold

```java
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;

@Service
public class MyService {
  @Handler
  public String myHandler(String greeting) {
    return greeting + "!";
  }

  public static void main(String[] args) {
    RestateHttpServer.listen(Endpoint.bind(new MyService()));
  }
}
```

### Register and Invoke

Start the service, then register and invoke:

```bash
restate deployments register http://localhost:9080
curl localhost:8080/MyService/greet --json '"World"'
```

---

## Core Concepts

- Restate provides durable execution: if a handler crashes or the process restarts, Restate replays the handler from the last completed step, not from scratch.
- Access all Restate functionality (state, calls, side effects, timers, ...) through the static methods on the `Restate` class (e.g. `Restate.state()`, `Restate.run(...)`, `Restate.sleep(...)`).
- Handlers take one optional JSON-serializable input parameter and return one JSON-serializable output.
- Call other services through `Restate.service(...)` / `Restate.serviceHandle(...)` (and the virtual-object/workflow variants) with a method reference.

---

## Service Types

### Service (Stateless)

See minimal scaffold above.

### Virtual Object (Stateful, Keyed)

```java
import dev.restate.sdk.Restate;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;

@VirtualObject
public class MyObject {

  @Handler
  public String myHandler(String greeting) {
    String objectId = Restate.key();

    return greeting + " " + objectId + "!";
  }

  @Shared
  public String myConcurrentHandler(String input) {
    return "my-output";
  }

  public static void main(String[] args) {
    RestateHttpServer.listen(Endpoint.bind(new MyObject()));
  }
}
```

- **Exclusive handlers** (`@Handler`): only one executes at a time per key. Use for writes. Have read/write state access via `Restate.state()`.
- **Shared handlers** (`@Shared`): run concurrently per key. Use for reads. Have read-only state access.

### Workflow

```java
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;

@Workflow
public class MyWorkflow {

  @Workflow
  public String run(String input) {

    // implement workflow logic here

    return "success";
  }

  @Shared
  public String interactWithWorkflow(String input) {
    // implement interaction logic here
    return "my result";
  }

  public static void main(String[] args) {
    RestateHttpServer.listen(Endpoint.bind(new MyWorkflow()));
  }
}
```

- `run` executes exactly once per workflow ID. Calling `run` again with the same ID attaches to the existing execution.
- Other handlers (marked `@Shared`) can be called concurrently while `run` is in progress. Use them to send signals or read state.

---

## State Management

Never use global variables for state -- it is not durable across restarts. Use `StateKey` with `Restate.state().get`/`Restate.state().set` instead:

```java
var state = Restate.state();
StateKey<String> STRING_STATE_KEY = StateKey.of("my-key", String.class);
String stringState = state.get(STRING_STATE_KEY).orElse("my-default");
state.set(STRING_STATE_KEY, "my-new-value");
state.clear(STRING_STATE_KEY);
state.clearAll();
Collection<String> keys = state.getAllKeys();
```

For generic types, use `TypeRef`:

```java
// import dev.restate.serde.TypeRef;
private static final StateKey<List<String>> ITEMS =
    StateKey.of("items", new TypeRef<List<String>>() {});
```

---

## Service Communication

### Request-Response Calls

Two client styles are available:

- **Simple client** (`Restate.service(...)` / `Restate.virtualObject(...)` / `Restate.workflow(...)`): the call is awaited inline and returns the result directly. Use for straightforward request-response.
- **Handle-based client** (`Restate.serviceHandle(...)` / `Restate.virtualObjectHandle(...)` / `Restate.workflowHandle(...)`, called with a method reference): returns a `DurableFuture` you await explicitly. Use it for invocation options (e.g. idempotency keys), timeouts, or concurrency.

```java
// Simple client: the call is awaited inline and returns the result directly.
// Use this for straightforward request-response calls.
String svcResponse = Restate.service(MyService.class).myHandler(request);
String objResponse = Restate.virtualObject(MyObject.class, objectKey).myHandler(request);
String wfResponse = Restate.workflow(MyWorkflow.class, workflowId).run(request);

// Handle-based client: returns a DurableFuture that you await explicitly.
// Use it for invocation options (e.g. an idempotency key), timeouts, or concurrency.
// (virtualObjectHandle(...) / workflowHandle(...) work the same way.)
String svcResult =
    Restate.serviceHandle(MyService.class).call(MyService::myHandler, request).await();
```

### One-Way Calls (Fire-and-Forget)

```java
Restate.serviceHandle(MyService.class).send(MyService::myHandler, request);
Restate.virtualObjectHandle(MyObject.class, objectKey).send(MyObject::myHandler, request);
Restate.workflowHandle(MyWorkflow.class, workflowId).send(MyWorkflow::run, request);
```

### Delayed Calls

```java
Restate.serviceHandle(MyService.class).send(MyService::myHandler, request, Duration.ofDays(5));
```

### Generic Calls (String-Based Service/Method Names)

Use when the target service type is not available at compile time:

```java
// Define target
Target target = Target.service("MyService", "myHandler");
Target objectTarget = Target.virtualObject("MyObject", "object-key", "myHandler");
Target workflowTarget = Target.workflow("MyWorkflow", "wf-id", "run");

// Do the call
String response =
    Restate.call(
            Request.of(target, TypeTag.of(String.class), TypeTag.of(String.class), request))
        .await();

// Or send the message
Restate.send(Request.of(target, TypeTag.of(String.class), TypeTag.of(String.class), request));
```

---

## Side Effects / Restate.run

Never call external APIs, databases, or non-deterministic functions directly in a handler. Wrap them in `Restate.run`:

```java
// Wrap non-deterministic code in Restate.run
String result = Restate.run("call external API", String.class, () -> callExternalAPI());

// Wrap with name for better tracing
String namedResult = Restate.run("my-side-effect", String.class, () -> callExternalAPI());
```

- The first argument is a label used for observability and debugging.
- The second argument is the return type class.
- The third argument is the function to execute.
- The return value must be JSON-serializable.

---

## Deterministic Helpers

Never use `Math.random()`, `System.currentTimeMillis()`, or `new Date()` directly -- they break deterministic replay. Use `Restate.random()` / `Restate.instantNow()` instead:

```java
float value = Restate.random().nextFloat();
UUID uuid = Restate.random().nextUUID();
```

---

## Durable Timers

Never use `Thread.sleep`. Use `Restate.sleep` for durable delays that survive crashes and restarts:

```java
Restate.sleep(Duration.ofHours(30));
```

---

## Awakeables

Awakeables pause execution until an external system signals completion:

```java
// Create awakeable
Awakeable<String> awakeable = Restate.awakeable(String.class);
String awakeableId = awakeable.id();

// Send ID to external system
Restate.run("request-human-review", () -> requestHumanReview(name, awakeableId));

// Wait for result
String review = awakeable.await();
```

External systems can also resolve/reject via HTTP:
`curl localhost:8080/restate/awakeables/<id>/resolve --json '"Looks good!"'`

Or from another handler:

```java
Restate.awakeableHandle(awakeableId).resolve(String.class, "Looks good!");
Restate.awakeableHandle(awakeableId).reject("Cannot be reviewed");
```

---

## Durable Promises (Workflows Only)

Cross-handler signaling within a Workflow. No ID management needed.

```java
DurablePromiseKey<String> REVIEW_PROMISE = DurablePromiseKey.of("review", String.class);
// Wait for promise
String review = Restate.promise(REVIEW_PROMISE).future().await();

// Resolve promise from another handler
Restate.promiseHandle(REVIEW_PROMISE).resolve(review);
```

---

## Concurrency

Use `DurableFuture` combinators, NOT `CompletableFuture`. Native combinators are not journaled and break deterministic replay.

### All (wait for all to complete)

```java
// Wait for all to complete
DurableFuture<String> call1 =
    Restate.serviceHandle(MyService.class).call(MyService::myHandler, "request1");
DurableFuture<String> call2 =
    Restate.serviceHandle(MyService.class).call(MyService::myHandler, "request2");

DurableFuture.all(call1, call2).await();
```

### Select (first to complete)

Returns the value of whichever future completes first:

```java
String res = Select.<String>select().or(call1).or(call2).await();
```

---

## Invocation Management

### Idempotency Keys

```java
var handle =
    Restate.serviceHandle(MyService.class)
        .send(MyService::myHandler, request, InvocationOptions.idempotencyKey("abc123"));
```

### Attach to a Running Invocation

```java
var response = handle.attach().await();
```

### Cancel an Invocation

```java
handle.cancel();
```

---

## Serialization

### Default: Jackson JSON

All handler inputs/outputs and state values use Jackson JSON serialization by default. Define standard POJOs or Java records for structured data.

### Custom Serde

Implement `Serde<T>` for custom serialization when Jackson defaults are not sufficient (binary payloads, non-JSON formats, or types with custom encoding). Pass the serde when declaring a `StateKey`, `DurablePromiseKey`, awakeable, or `Restate.run` call.

---

## Error Handling

Throw `TerminalException` to stop retries and propagate failure permanently:

```java
throw new TerminalException(500, "Something went wrong");
```

Note: the Java SDK uses `TerminalException`, NOT `TerminalError` (which is used by other SDKs).

Any other exception type causes automatic retries with exponential backoff. For retry policy configuration, refer to the retry guide.

### TerminalException metadata

You can attach a string metadata map to a `TerminalException`. The metadata is propagated to callers and accessible via `getMetadata()`. Requires Restate Server >= 1.6.

```java
throw new TerminalException("Something went wrong", Map.of("correlationId", correlationId));
```

Callers can read the metadata:

```java
Map<String, String> metadata = e.getMetadata();
String correlationId = metadata.get("correlationId");
```

---

## SDK Clients (External Invocations)

Use `Client` to call Restate handlers from outside a Restate context (e.g., from a REST API, a script, or a cron job):

```java
Client restateClient = Client.connect("http://localhost:8080");

// Request-response
String result = restateClient.service(MyService.class).myHandler("Hi");

// One-way
restateClient.serviceHandle(MyService.class).send(MyService::myHandler, "Hi");

// Delayed
restateClient
    .serviceHandle(MyService.class)
    .send(MyService::myHandler, "Hi", Duration.ofSeconds(1));

// With idempotency key
restateClient
    .virtualObjectHandle(MyObject.class, "Mary")
    .send(MyObject::myHandler, "Hi", InvocationOptions.idempotencyKey("abc"));
```

---

## Java-Specific Pitfalls

- **Use Restate's future combinators, NOT `CompletableFuture`.** Native Java futures break deterministic replay.
- **Never use `Thread.sleep`, `Math.random()`, or `System.currentTimeMillis()`** -- use `Restate` SDK actions instead.
- **Never use global mutable variables for state** -- use Restate's K/V store for durable state.
- **For detailed API reference:** use the MCP server or JavaDocs.

## Testing

Add dependency: `dev.restate:sdk-testing` (includes Testcontainers support)

Tests run against a real Restate Server in Docker. 

```java
package develop;

import static org.junit.jupiter.api.Assertions.assertEquals;

import dev.restate.client.Client;
import dev.restate.sdk.testing.BindService;
import dev.restate.sdk.testing.RestateClient;
import dev.restate.sdk.testing.RestateTest;
import org.junit.jupiter.api.Test;

@RestateTest
class MyServiceTestMethod {

  @BindService MyService service = new MyService();

  @Test
  void testMyHandler(@RestateClient Client ingressClient) {
    // Create the service client from the injected ingress client
    var client = ingressClient.service(MyService.class);

    // Send request to service and assert the response
    var response = client.myHandler("Hi");
    assertEquals(response, "Hi!");
  }
}
```

Use tests also to catch non-determinism bugs that unit tests miss: if handler code is non-deterministic, replay produces different results and the test fails.
You can do this by setting the environment variable `RESTATE_WORKER__INVOKER__INACTIVITY_TIMEOUT=0m` for the Restate Server.

---

## Further resources

- For detailed API: use the JavaDoc https://restatedev.github.io/sdk-java/javadocs/ or the bundled restate-docs MCP server
- Examples: https://github.com/restatedev/examples
- AI agent examples: https://github.com/restatedev/ai-examples