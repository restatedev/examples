# Hello world - Rust/Shuttle.rs example

Sample project configuration of a Restate service using Rust and [shuttle.rs](https://www.shuttle.dev/).

Have a look at the [Rust Quickstart guide](https://docs.restate.dev/get_started/quickstart?sdk=rust) for more information on how to use this project.

Run with:
```shell
cargo shuttle run --port 9080
```

Register the service with:
```shell
restate deployments register http://localhost:9080 --use-http1.1
```