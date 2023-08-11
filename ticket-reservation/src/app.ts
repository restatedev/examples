import * as restate from "@restatedev/restate-sdk";
import { userSessionApi, userSessionRouter } from "./user_session";
import { ticketDbApi, ticketDbRouter } from "./ticket_db";
import { checkoutApi, checkoutRouter } from "./checkout";

restate
  .createServer()
  .bindKeyedRouter(userSessionApi.path, userSessionRouter)
  .bindKeyedRouter(ticketDbApi.path, ticketDbRouter)
  .bindRouter(checkoutApi.path, checkoutRouter)
  .listen(8080);
