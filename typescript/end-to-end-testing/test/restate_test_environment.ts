import * as restate from "@restatedev/restate-sdk";

import {
  GenericContainer,
  StartedTestContainer,
  TestContainers,
  Wait,
} from "testcontainers";
import * as http2 from "http2";
import * as net from "net";

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
      )}/deployments`,
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

export class RestateTestEnvironment {
  constructor(
    readonly startedRestateHttpServer: http2.Http2Server,
    readonly startedRestateContainer: StartedTestContainer
  ) {}

  public baseUrl(): string {
    return `http://${this.startedRestateContainer.getHost()}:${this.startedRestateContainer.getMappedPort(
      8080
    )}`;
  }

  public adminAPIBaseUrl(): string {
    return `http://${this.startedRestateContainer.getHost()}:${this.startedRestateContainer.getMappedPort(
      9070
    )}`;
  }

  public async stop() {
    await this.startedRestateContainer.stop();
    this.startedRestateHttpServer.close();
  }

  public static async start(
    mountServicesFn: (server: restate.RestateServer) => void
  ): Promise<RestateTestEnvironment> {
    let startedRestateHttpServer = await prepareRestateServer(mountServicesFn);
    let startedRestateContainer = await prepareRestateTestContainer(
      (startedRestateHttpServer.address() as net.AddressInfo).port
    );
    return new RestateTestEnvironment(
      startedRestateHttpServer,
      startedRestateContainer
    );
  }
}
