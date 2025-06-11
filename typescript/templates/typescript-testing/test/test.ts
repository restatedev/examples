import { RestateTestEnvironment } from "@restatedev/restate-sdk-testcontainers";
import { exampleService } from "../src/example_service";
import { exampleObject } from "../src/example_object";
import { setTimeout } from "node:timers/promises";
import * as clients from "@restatedev/restate-sdk-clients";

describe("ExampleService", () => {
  let restateTestEnvironment: RestateTestEnvironment;
  let restateIngress: clients.Ingress;

  beforeAll(async () => {
    restateTestEnvironment = await RestateTestEnvironment.start((restateServer) =>
      restateServer.bind(exampleService),
    );
    restateIngress = clients.connect({ url: restateTestEnvironment.baseUrl() });
  }, 20_000);

  afterAll(async () => {
    if (restateTestEnvironment !== undefined) {
      await restateTestEnvironment.stop();
    }
  });

  it("works", async () => {
    const greet = await restateIngress.serviceClient(exampleService).greet("Sarah");

    // Assert the result
    expect(greet).toBe("Hello Sarah!");
  });
});

describe("ExampleObject", () => {
  let restateTestEnvironment: RestateTestEnvironment;
  let restateIngress: clients.Ingress;

  beforeAll(async () => {
    restateTestEnvironment = await RestateTestEnvironment.start((restateServer) =>
      restateServer.bind(exampleObject),
    );
    restateIngress = clients.connect({ url: restateTestEnvironment.baseUrl() });
  }, 20_000);

  afterAll(async () => {
    if (restateTestEnvironment !== undefined) {
      await restateTestEnvironment.stop();
    }
  });

  it("works", async () => {
    const state = restateTestEnvironment.stateOf(exampleObject, "Sarah");
    expect(await state.getAll()).toStrictEqual({});
    expect(await state.get("count")).toBeNull();

    // Setting state is an eventually consistent operation, so retrying might be needed
    let retry = 0;
    while (true) {
      try {
        await state.set("count", 123);
        break;
      } catch (e) {
        await setTimeout(1000);
        retry++;
        if (retry > 10) {
          throw new Error("Unable to set state 'count'");
        }
      }
    }
    const greet = await restateIngress.objectClient(exampleObject, "Sarah").greet();

    // Assert the result
    expect(greet).toBe("Hello Sarah! Counter: 123");
    expect(await state.get("count")).toStrictEqual(124);
  });
});
