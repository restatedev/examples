import {endpoint} from "@restatedev/restate-sdk";

import {queue} from "./queue";
import {myService} from "./service";

endpoint().bind(queue).bind(myService).listen();
