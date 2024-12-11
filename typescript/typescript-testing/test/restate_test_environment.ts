import * as restate from "@restatedev/restate-sdk";

import {
    GenericContainer,
    StartedTestContainer,
    TestContainers,
    Wait,
} from "testcontainers";
import { tableFromIPC } from "apache-arrow";
import * as http2 from "http2";
import * as net from "net";

// Prepare the restate server
async function prepareRestateEndpoint(
    mountServicesFn: (server: restate.RestateEndpoint) => void
): Promise<http2.Http2Server> {
    // Prepare RestateServer
    const restateEndpoint = restate.endpoint();
    mountServicesFn(restateEndpoint);

    // Start HTTP2 server on random port
    const restateHttpServer = http2.createServer(restateEndpoint.http2Handler());
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
        "docker.io/restatedev/restate:1.1"
    )
        // Expose ports
        .withExposedPorts(8080, 9070)
        // Wait start on health checks
        .withWaitStrategy(
            Wait.forAll([
                Wait.forHttp("/restate/health", 8080),
                Wait.forHttp("/health", 9070)
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

    public async setState(
      service: restate.VirtualObjectDefinition<any, any> | restate.WorkflowDefinition<any, any>,
      key: string, 
      newState: {[key: string]: any}) {
      const res = await fetch(
          `${this.adminAPIBaseUrl()}/services/${service.name}/state`,
          {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  object_key: key,
                  // the endpoint expects a map of key -> bytes as JSON array of numbers
                  new_state: Object.fromEntries(Object.entries(newState).map(([key, value]) => {
                    const valueJSON = new TextEncoder().encode(JSON.stringify(value))
                    
                    return [key, Array.from(valueJSON)]
                  })),
              }),
          }
      );

      if (!res.ok) {
          const badResponse = await res.text();
          throw new Error(
              `Error ${res.status} during modify state: ${badResponse}`
          );
      }
    }

    public async getState(
      service: restate.VirtualObjectDefinition<any, any> | restate.WorkflowDefinition<any, any>,
      key: string
    ): Promise<{[key: string]: any}> {
      const res = await fetch(
          `${this.adminAPIBaseUrl()}/query`,
          {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
              },
              body: JSON.stringify({
                  query: `SELECT key, value from state where service_name = '${service.name}' and service_key = '${key}';`,
              }),
          }
      );

      if (!res.ok) {
          const badResponse = await res.text();
          throw new Error(
              `Error ${res.status} during read state: ${badResponse}`
          );
      }

      const table = (await tableFromIPC(res)).toArray() as { key: string, value: Uint8Array }[];
      
      return Object.fromEntries(table.map(({key, value}) => {
        return [key, JSON.parse(new TextDecoder().decode(value))]
      }))
    }

    public async stop() {
        await this.startedRestateContainer.stop();
        this.startedRestateHttpServer.close();
    }

    public static async start(
        mountServicesFn: (server: restate.RestateEndpoint) => void
    ): Promise<RestateTestEnvironment> {
        let startedRestateHttpServer = await prepareRestateEndpoint(mountServicesFn);
        let startedRestateContainer = await prepareRestateTestContainer(
            (startedRestateHttpServer.address() as net.AddressInfo).port
        );
        return new RestateTestEnvironment(
            startedRestateHttpServer,
            startedRestateContainer
        );
    }
}
