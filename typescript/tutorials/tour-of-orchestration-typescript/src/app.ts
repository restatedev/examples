import * as restate from "@restatedev/restate-sdk";
import { subscriptionService } from "./getstarted/service";
import { subscriptionSaga } from "./sagas/service";
import { userSubscriptions } from "./objects/service";
import { concertTicketingService } from "./communication/service";
import { emailService, paymentService } from "./utils";
import { asyncPaymentServiceWithTimeout } from "./timers/service";
import { asyncPaymentService } from "./events/service";

restate
  .endpoint()
  .bind(subscriptionService)
  .bind(subscriptionSaga)
  .bind(userSubscriptions)
  .bind(concertTicketingService)
  .bind(asyncPaymentService)
  .bind(asyncPaymentServiceWithTimeout)
  .bind(paymentService)
  .bind(emailService)
  .listen(9080);
