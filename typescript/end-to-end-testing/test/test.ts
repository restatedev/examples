import * as restate from "@restatedev/restate-sdk";

import {
  GenericContainer,
  StartedTestContainer,
  TestContainers,
  Wait,
} from "testcontainers";
import { createPromiseClient, Transport } from "@connectrpc/connect";
import { createConnectTransport } from "@connectrpc/connect-node";
import { ExampleService } from "./generated/example_connect";
import * as http2 from "http2";
import * as net from "net";

import { protoMetadata } from "../src/generated/proto/example";
import { MyExampleService } from "../src/example_service";

// Prepare the restate server
async function prepareRestateServer(
  mountServicesFn: (server: restate.RestateServer) => void
): Promise<http2.Http2Server> {
  // Prepare RestateServer
  const restateServer = restate.createServer();
  mountServicesFn(restateServer);

  // Start HTTP2 server on random port
  const restateHttpServer = http2.createServer(restateServer);
  await new Promise((resolve, reject) => {
    restateHttpServer
      .listen(0)
      .once("listening", resolve)
      .once("error", reject);
  });
  const restateServerPort = (restateHttpServer.address() as net.AddressInfo)
    .port;
  console.info(`Started listening on port ${restateServerPort}`);

  return restateHttpServer;
}

// Prepare the restate testcontainer
async function prepareRestateTestContainer(
  restateServerPort: number
): Promise<StartedTestContainer> {
  const restateContainer = new GenericContainer(
    "docker.io/restatedev/restate:latest"
  )
    // Expose ports
    .withExposedPorts(8080, 9070)
    // Wait start on health checks
    .withWaitStrategy(
      Wait.forAll([
        Wait.forHttp("/grpc.health.v1.Health/Check", 8080),
        Wait.forHttp("/health", 9070),
      ])
    );

  // This MUST be executed before starting the restate container
  // Expose host port to access the restate server
  await TestContainers.exposeHostPorts(restateServerPort);

  // Start restate container
  const startedRestateContainer = await restateContainer.start();

  // From now on, if something fails, stop the container to cleanup the environment
  try {
    console.info("Going to register services");

    // Register this service endpoint
    const res = await fetch(
      `http://${startedRestateContainer.getHost()}:${startedRestateContainer.getMappedPort(
        9070
      )}/endpoints`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // See https://node.testcontainers.org/features/networking/#expose-host-ports-to-container
          uri: `http://host.testcontainers.internal:${restateServerPort}`,
        }),
      }
    );
    if (!res.ok) {
      const badResponse = await res.text();
      throw new Error(
        `Error ${res.status} during registration: ${badResponse}`
      );
    }

    console.info("Registered");
    return startedRestateContainer;
  } catch (e) {
    await startedRestateContainer.stop();
    throw e;
  }
}

describe("ExampleService", () => {
  let startedRestateHttpServer: http2.Http2Server;
  let startedRestateContainer: StartedTestContainer;
  let clientTransport: Transport;

  // Deploy Restate and the Service endpoint once for all the tests in this suite
  beforeAll(async () => {
    startedRestateHttpServer = await prepareRestateServer((restateServer) =>
      restateServer.bindService({
        service: "ExampleService",
        instance: new MyExampleService(),
        descriptor: protoMetadata,
      })
    );

    startedRestateContainer = await prepareRestateTestContainer(
      (startedRestateHttpServer.address() as net.AddressInfo).port
    );

    // Prepare the Connect client transport
    clientTransport = createConnectTransport({
      baseUrl: `http://${startedRestateContainer.getHost()}:${startedRestateContainer.getMappedPort(
        8080
      )}`,
      httpVersion: "1.1",
    });
  }, 10_000);

  // Stop Restate and the Service endpoint
  afterAll(async () => {
    await startedRestateContainer.stop();
    startedRestateHttpServer.close();
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
