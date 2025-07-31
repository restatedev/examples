import * as restate from "@restatedev/restate-sdk";

import { limiter } from "./limiter";
import { myService } from "./service";

restate.serve({
  services: [limiter, myService],
});
