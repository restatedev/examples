import * as restate from "@restatedev/restate-sdk";
import * as driverDigitalTwin from "./driver_digital_twin";
import * as driverDeliveryMatcher from "./driver_delivery_matcher";
import * as deliveryManager from "./delivery_manager";
import * as orderWorkflow from "./order_workflow";
import * as orderstatus from "./order_status_service";
import * as driverMobileAppSimulator from "./external/driver_mobile_app_sim";

if (require.main === module) {
  restate
      .createServer()
      .bindKeyedRouter(orderWorkflow.service.path, orderWorkflow.router)
      .bindKeyedRouter(orderstatus.service.path, orderstatus.router)
      .bindKeyedRouter(driverDigitalTwin.service.path, driverDigitalTwin.router)
      .bindKeyedRouter(driverDeliveryMatcher.service.path, driverDeliveryMatcher.router)
      .bindKeyedRouter(deliveryManager.service.path, deliveryManager.router)
      .bindKeyedRouter(driverMobileAppSimulator.service.path, driverMobileAppSimulator.router)
      .listen(9080);
}
