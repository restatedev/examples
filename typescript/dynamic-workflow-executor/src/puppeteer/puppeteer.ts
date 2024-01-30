import * as restate from "@restatedev/restate-sdk";
import * as puppeteerService from "./puppeteer_generator";

restate
    .createServer()
    .bindRouter(puppeteerService.service.path, puppeteerService.router)
    .listen(9081);