# Restate Java SDK Rules

## Core Concepts

* Restate provides durable execution: code automatically stores completed steps and resumes from where it left off on failures
* All handlers receive a `Context`/`ObjectContext`/`WorkflowContext`/`SharedObjectContext`/`SharedWorkflowContext` object as the first argument
* Handlers can take typed inputs and return typed outputs using Java classes and Jackson serialization

## Service Types

### Basic Services

```java Java {"CODE_LOAD::java/src/main/java/develop/MyService.java#here"}  theme={null}
import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;

@Service
public class MyService {
  @Handler
  public String myHandler(Context ctx, String greeting) {
    return greeting + "!";
  }

  public static void main(String[] args) {
    RestateHttpServer.listen(Endpoint.bind(new MyService()));
  }
}
```

### Virtual Objects (Stateful, Key-Addressable)

```java Java {"CODE_LOAD::java/src/main/java/develop/MyObject.java#here"}  theme={null}
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.SharedObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;

@VirtualObject
public class MyObject {

  @Handler
  public String myHandler(ObjectContext ctx, String greeting) {
    String objectId = ctx.key();

    return greeting + " " + objectId + "!";
  }

  @Shared
  public String myConcurrentHandler(SharedObjectContext ctx, String input) {
    return "my-output";
  }

  public static void main(String[] args) {
    RestateHttpServer.listen(Endpoint.bind(new MyObject()));
  }
}
```

### Workflows

```java Java {"CODE_LOAD::java/src/main/java/develop/MyWorkflow.java#here"}  theme={null}
import dev.restate.sdk.SharedWorkflowContext;
import dev.restate.sdk.WorkflowContext;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.Workflow;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;

@Workflow
public class MyWorkflow {

  @Workflow
  public String run(WorkflowContext ctx, String input) {

    // implement workflow logic here

    return "success";
  }

  @Shared
  public String interactWithWorkflow(SharedWorkflowContext ctx, String input) {
    // implement interaction logic here
    return "my result";
  }

  public static void main(String[] args) {
    RestateHttpServer.listen(Endpoint.bind(new MyWorkflow()));
  }
}
```

## Context Operations

### State Management (Virtual Objects & Workflows only)

❌ Never use static variables - not durable, lost across replicas.
✅ Use `ctx.get()` and `ctx.set()` - durable and scoped to the object's key.

```java {"CODE_LOAD::java/src/main/java/develop/agentsmd/Actions.java#state"}  theme={null}
// Get state keys
Collection<String> keys = ctx.stateKeys();

// Get state
StateKey<String> STRING_STATE_KEY = StateKey.of("my-key", String.class);
String stringState = ctx.get(STRING_STATE_KEY).orElse("my-default");

StateKey<Integer> INT_STATE_KEY = StateKey.of("count", Integer.class);
int count = ctx.get(INT_STATE_KEY).orElse(0);

// Set state
ctx.set(STRING_STATE_KEY, "my-new-value");
ctx.set(INT_STATE_KEY, count + 1);

// Clear state
ctx.clear(STRING_STATE_KEY);
ctx.clearAll();
```

### Service Communication

#### Request-Response

```java {"CODE_LOAD::java/src/main/java/develop/agentsmd/Actions.java#service_calls"}  theme={null}
// Call a Service
String svcResponse = MyServiceClient.fromContext(ctx).myHandler(request).await();

// Call a Virtual Object
String objResponse = MyObjectClient.fromContext(ctx, objectKey).myHandler(request).await();

// Call a Workflow
String wfResponse = MyWorkflowClient.fromContext(ctx, workflowId).run(request).await();
```

#### Generic Calls

Call a service without using the generated client, but just String names.

```java {"CODE_LOAD::java/src/main/java/develop/agentsmd/Actions.java#generic_calls"}  theme={null}
// Generic service call
Target target = Target.service("MyService", "myHandler");
String response =
    ctx.call(Request.of(target, TypeTag.of(String.class), TypeTag.of(String.class), request))
        .await();

// Generic object call
Target objectTarget = Target.virtualObject("MyObject", "object-key", "myHandler");
String objResponse =
    ctx.call(
            Request.of(
                objectTarget, TypeTag.of(String.class), TypeTag.of(String.class), request))
        .await();

// Generic workflow call
Target workflowTarget = Target.workflow("MyWorkflow", "wf-id", "run");
String wfResponse =
    ctx.call(
            Request.of(
                workflowTarget, TypeTag.of(String.class), TypeTag.of(String.class), request))
        .await();
```

#### One-Way Messages

```java {"CODE_LOAD::java/src/main/java/develop/agentsmd/Actions.java#sending_messages"}  theme={null}
// Call a Service
MyServiceClient.fromContext(ctx).send().myHandler(request);

// Call a Virtual Object
MyObjectClient.fromContext(ctx, objectKey).send().myHandler(request);

// Call a Workflow
MyWorkflowClient.fromContext(ctx, workflowId).send().run(request);
```

#### Delayed Messages

```java {"CODE_LOAD::java/src/main/java/develop/agentsmd/Actions.java#delayed_messages"}  theme={null}
MyServiceClient.fromContext(ctx).send().myHandler(request, Duration.ofDays(5));
```

#### With Idempotency Key

```java  theme={null}
Client restateClient = Client.connect("http://localhost:8080");
MyServiceClient.fromClient(restateClient)
    .send()
    .myHandler("Hi", opt -> opt.idempotencyKey("my-key"));
```

### Run Actions or Side Effects (Non-Deterministic Operations)

❌ Never call external APIs/DBs directly - will re-execute during replay, causing duplicates.
✅ Wrap in `ctx.run()` - Restate journals the result; runs only once.

```java {"CODE_LOAD::java/src/main/java/develop/agentsmd/Actions.java#durable_steps"}  theme={null}
// Wrap non-deterministic code in ctx.run
String result = ctx.run("call external API", String.class, () -> callExternalAPI());

// Wrap with name for better tracing
String namedResult = ctx.run("my-side-effect", String.class, () -> callExternalAPI());
```

### Deterministic randoms and time

❌ Never use `Math.random()` - non-deterministic and breaks replay logic.
✅ Use `ctx.random()` or `ctx.uuid()` - Restate journals the result for deterministic replay.

❌ Never use `System.currentTimeMillis()`, `new Date()` - returns different values during replay.
✅ Use `ctx.timer()` - Restate records and replays the same timestamp.

### Durable Timers and Sleep

❌ Never use `Thread.sleep()` or `CompletableFuture.delayedExecutor()` - not durable, lost on restarts.
✅ Use `ctx.sleep()` - durable timer that survives failures.

```java {"CODE_LOAD::java/src/main/java/develop/agentsmd/Actions.java#durable_timers"}  theme={null}
// Sleep
ctx.sleep(Duration.ofSeconds(30));

// Schedule delayed call (different from sleep + send)
Target target = Target.service("MyService", "myHandler");
ctx.send(
    Request.of(target, TypeTag.of(String.class), TypeTag.of(String.class), "Hi"),
    Duration.ofHours(5));
```

### Awakeables (External Events)

```java {"CODE_LOAD::java/src/main/java/develop/agentsmd/Actions.java#awakeables"}  theme={null}
// Create awakeable
Awakeable<String> awakeable = ctx.awakeable(String.class);
String awakeableId = awakeable.id();

// Send ID to external system
ctx.run(() -> requestHumanReview(name, awakeableId));

// Wait for result
String review = awakeable.await();

// Resolve from another handler
ctx.awakeableHandle(awakeableId).resolve(String.class, "Looks good!");

// Reject from another handler
ctx.awakeableHandle(awakeableId).reject("Cannot be reviewed");
```

### Durable Promises (Workflows only)

```java {"CODE_LOAD::java/src/main/java/develop/agentsmd/Actions.java#workflow_promises"}  theme={null}
DurablePromiseKey<String> REVIEW_PROMISE = DurablePromiseKey.of("review", String.class);
// Wait for promise
String review = ctx.promise(REVIEW_PROMISE).future().await();

// Resolve promise from another handler
ctx.promiseHandle(REVIEW_PROMISE).resolve(review);
```

## Concurrency

Always use Restate combinators (`DurableFuture.all`, `DurableFuture.any`) instead of Java's native `CompletableFuture` methods - they journal execution order for deterministic replay.

### `DurableFuture.all()` - Wait for All

Returns when all futures complete. Use to wait for multiple operations to finish.

```java {"CODE_LOAD::java/src/main/java/develop/agentsmd/Actions.java#combine_all"}  theme={null}
// Wait for all to complete
DurableFuture<String> call1 = MyServiceClient.fromContext(ctx).myHandler("request1");
DurableFuture<String> call2 = MyServiceClient.fromContext(ctx).myHandler("request2");

DurableFuture.all(call1, call2).await();
```

### `DurableFuture.any()` - First Successful Result

Returns the first successful result, ignoring rejections until all fail.

```java {"CODE_LOAD::java/src/main/java/develop/agentsmd/Actions.java#combine_any"}  theme={null}
// Wait for any to complete
int indexCompleted = DurableFuture.any(call1, call2).await();
```

### Invocation Management

```java {"CODE_LOAD::java/src/main/java/develop/agentsmd/Actions.java#cancel"}  theme={null}
var handle =
    MyServiceClient.fromContext(ctx)
        .send()
        .myHandler(request, req -> req.idempotencyKey("abc123"));
var response = handle.attach().await();
// Cancel invocation
handle.cancel();
```

## Serialization

### Default (Jackson JSON)

By default, Java SDK uses Jackson for JSON serialization with POJOs.

```java Java {"CODE_LOAD::java/src/main/java/develop/SerializationExample.java#state_keys"}  theme={null}
// Primitive types
var myString = StateKey.of("myString", String.class);
// Generic types need TypeRef (similar to Jackson's TypeReference)
var myMap = StateKey.of("myMap", TypeTag.of(new TypeRef<Map<String, String>>() {}));
```

### Custom Serialization

```java {"CODE_LOAD::java/src/main/java/develop/SerializationExample.java#customserdes"}  theme={null}
class MyPersonSerde implements Serde<Person> {
  @Override
  public Slice serialize(Person person) {
    // convert value to a byte array, then wrap in a Slice
    return Slice.wrap(person.toBytes());
  }

  @Override
  public Person deserialize(Slice slice) {
    // convert value to Person
    return Person.fromBytes(slice.toByteArray());
  }
}
```

And then use it, for example, in combination with `ctx.run`:

```java {"CODE_LOAD::java/src/main/java/develop/SerializationExample.java#use_person_serde"}  theme={null}
ctx.run(new MyPersonSerde(), () -> new Person());
```

## Error Handling

Restate retries failures indefinitely by default. For permanent business-logic failures (invalid input, declined payment), use TerminalException to stop retries immediately.

### Terminal Errors (No Retry)

```java Java {"CODE_LOAD::java/src/main/java/develop/ErrorHandling.java#here"}  theme={null}
throw new TerminalException(500, "Something went wrong");
```

### Retryable Errors

```java  theme={null}
// Any other thrown exception will be retried
throw new RuntimeException("Temporary failure - will retry");
```

## Testing

```java Java {"CODE_LOAD::java/src/main/java/develop/MyServiceTestMethod.java"}  theme={null}
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
    var client = MyServiceClient.fromClient(ingressClient);

    // Send request to service and assert the response
    var response = client.myHandler("Hi");
    assertEquals(response, "Hi!");
  }
}
```

## SDK Clients (External Invocations)

```java {"CODE_LOAD::java/src/main/java/develop/agentsmd/Clients.java#here"}  theme={null}
Client restateClient = Client.connect("http://localhost:8080");

// Request-response
String result = MyServiceClient.fromClient(restateClient).myHandler("Hi");

// One-way
MyServiceClient.fromClient(restateClient).send().myHandler("Hi");

// Delayed
MyServiceClient.fromClient(restateClient).send().myHandler("Hi", Duration.ofSeconds(1));

// With idempotency key
MyObjectClient.fromClient(restateClient, "Mary")
    .send()
    .myHandler("Hi", opt -> opt.idempotencyKey("abc"));
```


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.restate.dev/llms.txt