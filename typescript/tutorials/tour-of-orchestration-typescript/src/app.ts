import * as restate from "@restatedev/restate-sdk";
import { subscriptionService } from "./getstarted/service";
import { subscriptionSaga } from "./sagas/service";
import { userSubscriptions } from "./objects/service";
import { concertTicketingService } from "./communication/service";
import { emailService, paymentService } from "./utils";
import { paymentsWithTimeout } from "./timers/service";
import { payments } from "./events/service";
import {parallelSubscriptionService} from "./concurrenttasks/service";

restate
  .endpoint()
  .bind(subscriptionService)
  .bind(subscriptionSaga)
  .bind(userSubscriptions)
  .bind(concertTicketingService)
  .bind(payments)
  .bind(paymentsWithTimeout)
  .bind(parallelSubscriptionService)
  .bind(paymentService)
  .bind(emailService)
  .listen(9080);
