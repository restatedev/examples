import * as restate from "@restatedev/restate-sdk";
import {greeter} from "./app";

export const handler = restate.serve({
    services: [greeter],
});