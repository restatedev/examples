import * as restate from "@restatedev/restate-sdk";
import * as tm from "./taskmanager";
import * as slackbot from "./slackbot";
import * as chat from "./chat";

import { reminderTaskDefinition } from "./tasks/reminder";
import { flightPricesTaskDefinition } from "./tasks/flight_prices";
import { createServer } from "node:http2";

const mode = process.argv[2];

// (1) register the task types we have at the task manager
//     so that the task manager knows where to send certain commands to

tm.registerTaskWorkflow(reminderTaskDefinition);
tm.registerTaskWorkflow(flightPricesTaskDefinition);

// (2) build the endpoint with the core handlers for the chat

let endpointHandler = restate.createEndpointHandler({
  services: [chat.chatSessionService, tm.workflowInvoker],
});

// (3) add slackbot, if in slack mode

if (mode === "SLACK") {
  endpointHandler = restate.createEndpointHandler({
    services: [chat.chatSessionService, tm.workflowInvoker, ...slackbot.services],
  });
  chat.notificationHandler(slackbot.notificationHandler);
}

// create a http2 server (alternatively export as lambda handler, http handler, ...)
createServer(endpointHandler).listen(9080);
