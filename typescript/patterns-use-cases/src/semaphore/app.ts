import * as restate from "@restatedev/restate-sdk";

import { semaphore } from "./semaphore";
import { myService } from "./service";

restate.serve({
  services: [semaphore, myService],
});
