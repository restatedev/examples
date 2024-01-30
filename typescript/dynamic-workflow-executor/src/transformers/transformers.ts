import * as restate from "@restatedev/restate-sdk";
import * as rotateImgService from "./rotate_img_service";
import * as blurImgService from "./blur_img_service";

restate
    .createServer()
    .bindRouter(rotateImgService.service.path, rotateImgService.router)
    .bindRouter(blurImgService.service.path, blurImgService.router)
    .listen(9083);