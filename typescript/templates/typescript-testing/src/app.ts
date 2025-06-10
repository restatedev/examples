import * as restate from "@restatedev/restate-sdk";
import { exampleService } from "./example_service";
import { exampleObject } from "./example_object";

// Template of a Restate service and handler
//
// Have a look at the TS QuickStart to learn how to run this: https://docs.restate.dev/get_started/quickstart?sdk=ts
//

// Create the Restate server to accept requests
restate.endpoint().bind(exampleService).bind(exampleObject).listen(9080);
