import * as restate from "@restatedev/restate-sdk";
import { userService } from "./utils";
import { signupWorkflow } from "./workflows/signup-workflow";
import { signupWithActivities } from "./workflows/signup-with-activities";
import { signupWithEvents } from "./workflows/signup-with-events";
import { signupWithQueries } from "./workflows/signup-with-queries";
import { signupWithSignals } from "./workflows/signup-with-signals";
import { signupWithTimers } from "./workflows/signup-with-timers";
import { signupWithSagas } from "./workflows/signup-with-sagas";
import { signupWithRetries } from "./workflows/signup-with-retries";

restate.serve({
  services: [
    // Workflows
    signupWorkflow,
    signupWithActivities,
    signupWithEvents,
    signupWithQueries,
    signupWithSignals,
    signupWithTimers,
    signupWithRetries,
    signupWithSagas,
    // Utils
    userService,
  ],
  port: 9080,
});
