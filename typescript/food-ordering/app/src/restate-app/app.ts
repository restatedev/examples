import * as restate from "@restatedev/restate-sdk";
import * as driver from "./driver";
import * as driver_pool from "./driver_pool";
import * as deliveryManager from "./delivery-manager";
import * as orders from "./order_service";
import * as orderstatus from "./order_status_service";
import * as driverMobileAppSimulator from "./external/driver_mobile_app_sim";

if (require.main === module) {
  restate
      .createServer()
      .bindKeyedRouter(orders.service.path, orders.router)
      .bindKeyedRouter(orderstatus.service.path, orderstatus.router)
      .bindKeyedRouter(driver.service.path, driver.router)
      .bindKeyedRouter(driver_pool.service.path, driver_pool.router)
      .bindKeyedRouter(deliveryManager.service.path, deliveryManager.router)
      .bindKeyedRouter(driverMobileAppSimulator.service.path, driverMobileAppSimulator.router)
      .listen(9080);
}
