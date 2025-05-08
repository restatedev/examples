import * as restate from "@restatedev/restate-sdk";
import { buffer } from "./buffer";
import { consumer } from "./consumer";
import { producer } from "./producer";

restate.endpoint().bind(buffer).bind(consumer).bind(producer).listen(9080);
