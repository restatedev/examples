# Hello world - Go Kubernetes template

Sample Restate service using the Go SDK, with an in-process tunnel, a Dockerfile, and Kubernetes YAML files.

See the [Kubernetes service deployment guide](https://docs.restate.dev/services/deploy/kubernetes) for more information on using this template to deploy to Kubernetes.

Build the container image with `docker build -t <registry>/my-restate-service:0.0.1 .`.
The Restate operator injects the tunnel configuration when using `tunnelMode: in-process`. The authentication token file is mounted on the deployment.

Invoke `Greeter/Greet` with a JSON object body: `{"name":"World"}`.

## Using AI coding tools

If you use Claude Code or Codex, then the Restate plugin will automatically be installed. For Cursor, consult the [skills repo README](https://github.com/restatedev/skills).

Plugin repo: https://github.com/restatedev/skills/tree/main
