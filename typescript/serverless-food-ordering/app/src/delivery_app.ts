import * as restate from "@restatedev/restate-sdk";
import * as driver from "./services/driver";
import * as driver_pool from "./services/driver_pool";
import * as delivery from "./services/delivery";
import * as restaurant_proxy from "./services/restaurant_proxy";

if (require.main === module) {
    restate
        .createServer()
        .bindKeyedRouter(driver.service.path, driver.router)
        .bindKeyedRouter(driver_pool.service.path, driver_pool.router)
        .bindKeyedRouter(delivery.service.path, delivery.router)
        .bindKeyedRouter(restaurant_proxy.service.path, restaurant_proxy.router)
        .listen(8085);
}
