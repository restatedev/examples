import * as restate from "@restatedev/restate-sdk";

import { queue } from "./queue";
import { myService } from "./service";

restate.serve({
  services: [queue, myService],
});
