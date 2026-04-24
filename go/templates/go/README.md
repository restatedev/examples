# Hello world - Go example

Sample project configuration of a Restate service using the Go SDK.

You can run locally with `go run .` and register to Restate with
`restate dep add http://localhost:9080`. Then you can invoke with `curl localhost:8080/Greeter/Greet --json '"hello"'`.

You can build a docker image using [ko](https://github.com/ko-build/ko):
`ko build --platform=all`

## Using AI coding tools

If you use Claude Code or Codex, then the Restate plugin will automatically be installed. For Cursor, consult the [skills repo README](https://github.com/restatedev/skills).

Plugin repo: https://github.com/restatedev/skills/tree/main
