import * as restate from "@restatedev/restate-sdk";
import * as orderWorkflow from "./order_workflow";
import * as orderstatus from "./order_status_service";

if (require.main === module) {
    restate
        .createServer()
        .bindKeyedRouter(orderWorkflow.service.path, orderWorkflow.router)
        .bindKeyedRouter(orderstatus.service.path, orderstatus.router)
        .listen(9080);
}
