# Restate Python SDK Rules

## Core Concepts

* Restate provides durable execution: code automatically stores completed steps and resumes from where it left off on failures
* All handlers receive a `Context`/`ObjectContext`/`WorkflowContext`/`ObjectSharedContext`/`WorkflowSharedContext` object as the first argument
* Handlers can take typed inputs and return typed outputs using Python type hints and Pydantic models

## Service Types

### Basic Services

```python {"CODE_LOAD::python/src/develop/my_service.py"}  theme={null}
import restate

my_service = restate.Service("MyService")


@my_service.handler("myHandler")
async def my_handler(ctx: restate.Context, greeting: str) -> str:
    return f"{greeting}!"


app = restate.app([my_service])
```

### Virtual Objects (Stateful, Key-Addressable)

```python {"CODE_LOAD::python/src/develop/my_virtual_object.py"}  theme={null}
import restate

my_object = restate.VirtualObject("MyVirtualObject")


@my_object.handler("myHandler")
async def my_handler(ctx: restate.ObjectContext, greeting: str) -> str:
    return f"{greeting} {ctx.key()}!"


@my_object.handler(kind="shared")
async def my_concurrent_handler(ctx: restate.ObjectSharedContext, greeting: str) -> str:
    return f"{greeting} {ctx.key()}!"


app = restate.app([my_object])
```

### Workflows

```python {"CODE_LOAD::python/src/develop/my_workflow.py"}  theme={null}
import restate

my_workflow = restate.Workflow("MyWorkflow")


@my_workflow.main()
async def run(ctx: restate.WorkflowContext, req: str) -> str:
    # ... implement workflow logic here ---
    return "success"


@my_workflow.handler()
async def interact_with_workflow(ctx: restate.WorkflowSharedContext, req: str):
    # ... implement interaction logic here ...
    return


app = restate.app([my_workflow])
```

## Context Operations

### State Management (Virtual Objects & Workflows only)

❌ Never use global variables - not durable, lost across replicas.
✅ Use `ctx.get()` and `ctx.set()` - durable and scoped to the object's key.

```python {"CODE_LOAD::python/src/develop/agentsmd/actions.py#state"}  theme={null}
# Get state
count = await ctx.get("count", type_hint=int) or 0

# Set state
ctx.set("count", count + 1)

# Clear state
ctx.clear("count")
ctx.clear_all()

# Get all state keys
keys = ctx.state_keys()
```

### Service Communication

#### Request-Response

```python {"CODE_LOAD::python/src/develop/agentsmd/actions.py#service_calls"}  theme={null}
# Call a Service
response = await ctx.service_call(my_handler, "Hi")

# Call a Virtual Object
response2 = await ctx.object_call(my_object_handler, key="object-key", arg="Hi")

# Call a Workflow
response3 = await ctx.workflow_call(run, "wf-id", arg="Hi")
```

#### One-Way Messages

```python {"CODE_LOAD::python/src/develop/agentsmd/actions.py#sending_messages"}  theme={null}
ctx.service_send(my_handler, "Hi")
ctx.object_send(my_object_handler, key="object-key", arg="Hi")
ctx.workflow_send(run, "wf-id", arg="Hi")
```

#### Delayed Messages

```python {"CODE_LOAD::python/src/develop/agentsmd/actions.py#delayed_messages"}  theme={null}
ctx.service_send(
    my_handler,
    "Hi",
    send_delay=timedelta(hours=5)
)
```

#### Generic Calls

Call a service without using the generated client, but just String names.

```python {"CODE_LOAD::python/src/develop/agentsmd/actions.py#request_response_generic"}  theme={null}
response_bytes = await ctx.generic_call(
    "MyObject", "my_handler", key="Mary", arg=json.dumps("Hi").encode("utf-8")
)
```

#### With Idempotency Key

```python  theme={null}
response = await ctx.service_call(
    my_service.my_handler,
    "Hi",
    idempotency_key="my-key"
)
```

### Run Actions or Side Effects (Non-Deterministic Operations)

❌ Never call external APIs/DBs directly - will re-execute during replay, causing duplicates.
✅ Wrap in `ctx.run()` or `ctx.run_typed()` - Restate journals the result; runs only once.

```python {"CODE_LOAD::python/src/develop/agentsmd/actions.py#durable_steps"}  theme={null}
# Wrap non-deterministic code in ctx.run
result = await ctx.run_typed("my-side-effect", lambda: call_external_api("weather", "123"))

# Or with typed version for better type safety
result = await ctx.run_typed("my-side-effect", call_external_api, query="weather", some_id="123")
```

### Deterministic randoms and time

❌ Never use `random.random()` - non-deterministic and breaks replay logic.
✅ Use `ctx.random()` or `ctx.uuid4()` - Restate journals the result for deterministic replay.

❌ Never use `time.time()`, `datetime.now()` - returns different values during replay.
✅ Use `ctx.now()` - Restate records and replays the same timestamp.

### Durable Timers and Sleep

❌ Never use `asyncio.sleep()` or `time.sleep()` - not durable, lost on restarts.
✅ Use `ctx.sleep()` - durable timer that survives failures.

```python {"CODE_LOAD::python/src/develop/agentsmd/actions.py#durable_timers"}  theme={null}
# Sleep
await ctx.sleep(timedelta(seconds=30))

# Schedule delayed call (different from sleep + send)
ctx.service_send(
    my_handler,
    "Hi",
    send_delay=timedelta(hours=5)
)
```

### Awakeables (External Events)

```python {"CODE_LOAD::python/src/develop/agentsmd/actions.py#awakeables"}  theme={null}
# Create awakeable
awakeable_id, promise = ctx.awakeable(type_hint=str)

# Send ID to external system
await ctx.run_typed("request_human_review", request_human_review, name=name, awakeable_id=awakeable_id)

# Wait for result
review = await promise

# Resolve from another handler
ctx.resolve_awakeable(awakeable_id, "Looks good!")

# Reject from another handler
ctx.reject_awakeable(awakeable_id, "Cannot be reviewed")
```

### Durable Promises (Workflows only)

```python {"CODE_LOAD::python/src/develop/agentsmd/actions.py#workflow_promises"}  theme={null}
# Wait for promise
review = await ctx.promise("review", type_hint=str).value()

# Resolve promise
await ctx.promise("review", type_hint=str).resolve("approval")
```

## Concurrency

Always use Restate combinators (`restate.gather`, `restate.select`) instead of Python's native `asyncio` methods - they journal execution order for deterministic replay.

### `restate.gather()` - Wait for All

Returns when all futures complete. Use to wait for multiple operations to finish.

```python {"CODE_LOAD::python/src/develop/agentsmd/actions.py#gather"}  theme={null}
# ❌ BAD
results1 = await asyncio.gather(call1(), call2())

# ✅ GOOD
claude_call = ctx.service_call(ask_openai, "What is the weather?")
openai_call = ctx.service_call(ask_claude, "What is the weather?")
results2 = await restate.gather(claude_call, openai_call)
```

### `restate.select()` - Race Multiple Operations

Returns immediately when the first future completes. Use for timeouts and racing operations.

```python {"CODE_LOAD::python/src/develop/agentsmd/actions.py#select"}  theme={null}
# ❌ BAD
result1 = await asyncio.wait([call1(), call2()], return_when=asyncio.FIRST_COMPLETED)

# ✅ GOOD
confirmation = ctx.awakeable(type_hint=str)
match await restate.select(
    confirmation=confirmation[1],
    timeout=ctx.sleep(timedelta(days=1))
):
    case ["confirmation", result]:
        print("Got confirmation:", result)
    case ["timeout", _]:
        raise restate.TerminalError("Timeout!")
```

### Invocation Management

```python {"CODE_LOAD::python/src/develop/agentsmd/actions.py#cancel"}  theme={null}
# Send a request, get the invocation id
handle = ctx.service_send(
    my_handler, arg="Hi", idempotency_key="my-idempotency-key"
)
invocation_id = await handle.invocation_id()

# Now re-attach
result = await ctx.attach_invocation(invocation_id)

# Cancel invocation
ctx.cancel_invocation(invocation_id)
```

## Serialization

### Default (JSON)

By default, Python SDK uses built-in JSON support with type hints.

### Pydantic Models

For type safety and validation with Pydantic:

```python {"CODE_LOAD::python/src/develop/agentsmd/serialization.py#pydantic"}  theme={null}
import restate
from pydantic import BaseModel
from restate.serde import Serde


class Greeting(BaseModel):
    name: str

class GreetingResponse(BaseModel):
    result: str

greeter = restate.Service("Greeter")

@greeter.handler()
async def greet(ctx: restate.Context, greeting: Greeting) -> GreetingResponse:
    return GreetingResponse(result=f"You said hi to {greeting.name}!")
```

### Custom Serialization

```python {"CODE_LOAD::python/src/develop/agentsmd/serialization.py#custom"}  theme={null}
class MyData(typing.TypedDict):
    """Represents a response from the GPT model."""

    some_value: str
    my_number: int


class MySerde(Serde[MyData]):
    def deserialize(self, buf: bytes) -> typing.Optional[MyData]:
        if not buf:
            return None
        data = json.loads(buf)
        return MyData(some_value=data["some_value"], my_number=data["some_number"])

    def serialize(self, obj: typing.Optional[MyData]) -> bytes:
        if obj is None:
            return bytes()
        data = {"some_value": obj["some_value"], "some_number": obj["my_number"]}
        return bytes(json.dumps(data), "utf-8")

# For the input/output serialization of your handlers
@my_object.handler(input_serde=MySerde(), output_serde=MySerde())
async def my_handler(ctx: restate.ObjectContext, greeting: str) -> str:

    # To serialize state
    await ctx.get("my_state", serde=MySerde())
    ctx.set("my_state", MyData(some_value="Hi", my_number=15), serde=MySerde())

    # To serialize awakeable payloads
    ctx.awakeable(serde=MySerde())

    # etc.

    return "some-output"
```

## Error Handling

Restate retries failures indefinitely by default. For permanent business-logic failures (invalid input, declined payment), use TerminalError to stop retries immediately.

### Terminal Errors (No Retry)

```python {"CODE_LOAD::python/src/develop/agentsmd/error_handling.py#terminal"}  theme={null}
from restate import TerminalError

raise TerminalError("Invalid input - will not retry")
```

### Retryable Errors

```python  theme={null}
# Any other thrown error will be retried
raise Exception("Temporary failure - will retry")
```

## Testing

Install with `pip install restate_sdk[harness]`

```python {"CODE_LOAD::python/src/develop/agentsmd/testing.py#here"}  theme={null}
import restate

from src.develop.my_service import app

with restate.test_harness(app) as harness:
    restate_client = harness.ingress_client()
    print(restate_client.post("/greeter/greet", json="Alice").json())
```


---

> To find navigation and other pages in this documentation, fetch the llms.txt file at: https://docs.restate.dev/llms.txt