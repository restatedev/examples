import { createPromiseClient, Transport } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";
import { ExampleService } from "./generated/example_connect";

import { protoMetadata } from "../src/generated/proto/example";
import { MyExampleService } from "../src/example_service";
import { RestateTestEnvironment } from "./restate_test_environment";

describe("ExampleService", () => {
  let restateTestEnvironment: RestateTestEnvironment;
  let clientTransport: Transport;

  // Deploy Restate and the Service endpoint once for all the tests in this suite
  beforeAll(async () => {
    restateTestEnvironment = await RestateTestEnvironment.start(
      (restateServer) =>
        restateServer.bindService({
          service: "ExampleService",
          instance: new MyExampleService(),
          descriptor: protoMetadata,
        })
    );

    // Prepare the Connect client transport
    clientTransport = createConnectTransport({
      baseUrl: restateTestEnvironment.baseUrl(),
      httpVersion: "1.1",
    });
  }, 10_000);

  // Stop Restate and the Service endpoint
  afterAll(async () => {
    await restateTestEnvironment.stop();
  });

  it("works", async () => {
    // Create the client for the service to invoke
    const serviceClient = createPromiseClient(ExampleService, clientTransport);
    // Invoke the service
    const result = await serviceClient.sampleCall({ request: "Francesco" });
    // Assert the result
    expect(result.response).toBe("Hello Francesco");
  });
});
