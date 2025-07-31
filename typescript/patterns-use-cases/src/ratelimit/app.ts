import { serve } from "@restatedev/restate-sdk";

import { limiter } from "./limiter";
import { myService } from "./service";

serve({
  services: [limiter, myService],
});
