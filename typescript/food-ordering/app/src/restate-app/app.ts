import * as restate from "@restatedev/restate-sdk";
import * as driver from "./services/driver";
import * as driver_pool from "./services/driver_pool";
import * as delivery from "./services/delivery";
import * as orders from "./services/order_service";
import * as orderstatus from "./services/order_status_service";
import * as driversim from "./services/driversim";

if (require.main === module) {
  restate
      .createServer()
      .bindKeyedRouter(orders.service.path, orders.router)
      .bindKeyedRouter(orderstatus.service.path, orderstatus.router)
      .bindKeyedRouter(driver.service.path, driver.router)
      .bindKeyedRouter(driver_pool.service.path, driver_pool.router)
      .bindKeyedRouter(delivery.service.path, delivery.router)
      .bindKeyedRouter(driversim.service.path, driversim.router)
      .listen(9080);
}
