import * as restate from "@restatedev/restate-sdk";
import { emailService, userService } from "./utils";
import { signupWorkflow } from "./getstarted/workflow";
import { signupWithActivities } from "./activities/workflow";
import { signupWithEvents } from "./events/workflow";
import { signupWithQueries } from "./queries/workflow";
import { signupWithSignals } from "./signals/workflow";
import { signupWithTimers } from "./timers/workflow";
import { signupWithSagas } from "./sagas/workflow";
import { signupWithRetries } from "./retries/workflow";

restate
  .endpoint()
  .bind(signupWorkflow)
  .bind(signupWithActivities)
  .bind(signupWithEvents)
  .bind(signupWithQueries)
  .bind(signupWithSignals)
  .bind(signupWithTimers)
  .bind(signupWithRetries)
  .bind(signupWithSagas)
  .bind(emailService)
  .bind(userService)
  .listen(9080);
