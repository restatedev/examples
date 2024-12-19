import { RestateTestEnvironment } from "@restatedev/restate-sdk-testcontainers";
import { exampleService } from "../src/example_service";
import { exampleObject } from "../src/example_object";
import * as clients from "@restatedev/restate-sdk-clients";

describe("ExampleObject", () => {
    let restateTestEnvironment: RestateTestEnvironment;
    let restateIngress: clients.Ingress;

    beforeAll(async () => {
        restateTestEnvironment = await RestateTestEnvironment.start(
            (restateServer) => restateServer.bind(exampleService)
        );
        restateIngress = clients.connect({ url: restateTestEnvironment.baseUrl() });
    }, 20_000);

    afterAll(async () => {
        if (restateTestEnvironment !== undefined) {
            await restateTestEnvironment.stop();
        }
    });

    it("works", async () => {
        const greet = await restateIngress.serviceClient(exampleService)
            .greet("Sarah");

        // Assert the result
        expect(greet).toBe("Hello Sarah!");
    });
});

describe("ExampleObject", () => {
    let restateTestEnvironment: RestateTestEnvironment;
    let restateIngress: clients.Ingress;

    beforeAll(async () => {
        restateTestEnvironment = await RestateTestEnvironment.start(
            (restateServer) => restateServer.bind(exampleObject)
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
        expect(await state.getAll()).toStrictEqual({})
        expect(await state.get("count")).toBeNull();
        
        await state.set("count", 123)
        const greet = await restateIngress.objectClient(exampleObject, "Sarah")
            .greet();

        // Assert the result
        expect(greet).toBe("Hello Sarah! Counter: 123");
        expect(await state.get("count")).toStrictEqual(124)
    });
});
