/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate examples,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */

import * as restate from "@restatedev/restate-sdk";
import * as rotateImgService from "./rotate_img_service";
import * as blurImgService from "./blur_img_service";

restate
    .endpoint()
    .bindRouter(rotateImgService.service.path, rotateImgService.router)
    .bindRouter(blurImgService.service.path, blurImgService.router)
    .listen(9083);