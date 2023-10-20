import * as restate from "@restatedev/restate-sdk";
import * as orders from "./services/order_service";
import * as orderstatus from "./services/order_status_service";

export const handler = restate
  .createLambdaApiGatewayHandler()
  .bindKeyedRouter(orders.service.path, orders.router)
  .bindKeyedRouter(orderstatus.service.path, orderstatus.router)
  .handle();
