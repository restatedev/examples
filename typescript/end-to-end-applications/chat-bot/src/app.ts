import * as restate from "@restatedev/restate-sdk"
import * as tm from "./taskmanager" 
import * as slackbot from "./slackbot"
import * as chat from "./chat"

import { reminderTaskDefinition } from "./tasks/reminder";
import { flightPricesTaskDefinition } from "./tasks/flight_prices";

const mode = process.argv[2];

// (1) register the task types we have at the task manager
//     so that the task manager knows where to send certain commands to

tm.registerTaskWorkflow(reminderTaskDefinition);
tm.registerTaskWorkflow(flightPricesTaskDefinition)

// (2) build the endpoint with the core handlers for the chat

const endpoint = restate.endpoint()
    .bind(chat.chatSessionService)
    .bind(tm.workflowInvoker)

// (3) add slackbot, if in slack mode

if (mode === "SLACK") {
    endpoint.bindBundle(slackbot.services)
    chat.notificationHandler(slackbot.notificationHandler)
}

// start the defaut http2 server (alternatively export as lambda handler, http handler, ...)
endpoint.listen(9080);
