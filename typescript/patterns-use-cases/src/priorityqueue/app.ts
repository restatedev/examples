import { serve } from "@restatedev/restate-sdk";

import { queue } from "./queue";
import { myService } from "./service";

serve({
  services: [queue, myService],
});
