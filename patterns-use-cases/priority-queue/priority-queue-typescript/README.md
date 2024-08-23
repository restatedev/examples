# Priority queue

An example of implementing your own priority queue using Restate state and
awakeables.

Run the example with `npm run app-dev`.

You can simulate adding work to the queue like this:
```shell
# add a single entry
curl localhost:8080/myService/expensiveMethod/send --json '{"left": 1, "right": 2}'
# add lots
for i in $(seq 1 30); do curl localhost:8080/myService/expensiveMethod/send --json '{"left": 1, "right": 2}'; done
```

As you do so, you can observe the logs; in flight requests will increase up to 10, beyond which items will be enqueued.

You can write your own queue item selection logic in `selectAndPopItem`; doing so is outside the scope of this example.
