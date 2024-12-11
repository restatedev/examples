import { RestateTestEnvironment } from "./restate_test_environment";
import { exampleService } from "../src/example_service";
import { exampleObject } from "../src/example_object";
import * as clients from "@restatedev/restate-sdk-clients";

describe("ExampleService", () => {
    let restateTestEnvironment: RestateTestEnvironment;

    // Deploy Restate and the Service endpoint once for all the tests in this suite
    beforeAll(async () => {
        restateTestEnvironment = await RestateTestEnvironment.start(
            (restateServer) =>
                restateServer.bind(exampleService)
        );
    }, 20_000);

    // Stop Restate and the Service endpoint
    afterAll(async () => {
        if (restateTestEnvironment !== undefined) {
            await restateTestEnvironment.stop();
        }
    });

    it("works", async () => {
        const rs = clients.connect({url: restateTestEnvironment.baseUrl()});
        const greet = await rs.serviceClient(exampleService)
            .greet("Sarah");

        // Assert the result
        expect(greet).toBe("Hello Sarah!");
    });
});

describe("ExampleObject", () => {
    let restateTestEnvironment: RestateTestEnvironment;

    // Deploy Restate and the Service endpoint once for all the tests in this suite
    beforeAll(async () => {
        restateTestEnvironment = await RestateTestEnvironment.start(
            (restateServer) =>
                restateServer.bind(exampleObject)
        );
    }, 20_000);

    // Stop Restate and the Service endpoint
    afterAll(async () => {
        if (restateTestEnvironment !== undefined) {
            await restateTestEnvironment.stop();
        }
    });

    it("works", async () => {
        const rs = clients.connect({url: restateTestEnvironment.baseUrl()});
        expect(await restateTestEnvironment.getState(exampleObject, "Sarah")).toStrictEqual({})
        
        await restateTestEnvironment.setState(exampleObject, "Sarah", {count: 123})
        const greet = await rs.objectClient(exampleObject, "Sarah")
            .greet();

        // Assert the result
        expect(greet).toBe("Hello Sarah! Counter: 123");
        expect(await restateTestEnvironment.getState(exampleObject, "Sarah")).toStrictEqual({count: 124})
    });
});
