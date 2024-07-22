import { RestateTestEnvironment } from "./restate_test_environment";
import { exampleService } from "../src/example_service";
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