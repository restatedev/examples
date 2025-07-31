import * as restate from "@restatedev/restate-sdk/fetch";
import { greeter } from "./services/greeter";

// Create the Restate endpoint to accept requests
export const endpoint = restate.createEndpointHandler({ services: [greeter] });
