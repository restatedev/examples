import * as restate from "@restatedev/restate-sdk";
import { emailService, userService } from "./utils";
import { signupWorkflow } from "./getstarted/app";
import { signupWithActivities } from "./activities/app";
import { signupWithEvents } from "./events/app";
import { signupWithQueries } from "./queries/app";
import { signupWithSignals } from "./signals/app";
import { signupWithTimers } from "./timers/app";
import { signupWithSagas } from "./sagas/app";
import { signupWithRetries } from "./retries/app";

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
