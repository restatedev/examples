import * as restate from "@restatedev/restate-sdk";

import { protoMetadata } from "./generated/proto/example";
import { MyExampleService } from "./example_service";

// Create the Restate server to accept requests to the service(s)
restate
  .createServer()
  .bindService({
    service: "ExampleService", // public name of the service, must match the name in the .proto definition
    instance: new MyExampleService(), // the instance of the implementation
    descriptor: protoMetadata, // the metadata (types, interfaces, ...) captured by the gRPC/protobuf compiler
  })
  .listen(9080);
