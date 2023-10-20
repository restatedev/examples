import * as restate from "@restatedev/restate-sdk";
import * as driversim from "./services/driversim";

if (require.main === module) {
    restate
        .createServer()
        .bindKeyedRouter(driversim.service.path, driversim.router)
        .listen(5051);
}