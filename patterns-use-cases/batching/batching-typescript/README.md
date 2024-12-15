# Priority queue

An example of implementing a batching stream processing handler.

Run the example with `npm run app-dev`.

You can simulate adding work to the queue like this:
```shell
# add one item
curl localhost:8080/batcher/myKey/receive --json '123'
# add lots
for i in $(seq 1 31); do curl localhost:8080/batcher/myKey/receive --json "$i"; done
```

As you do so, you can observe the logs; batches of 10 will be sent, with a timeout after a second if batches are not filled.
