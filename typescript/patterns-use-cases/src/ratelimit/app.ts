import { endpoint } from "@restatedev/restate-sdk";

import { limiter } from "./limiter";
import { myService } from "./service";

endpoint().bind(limiter).bind(myService).listen();
