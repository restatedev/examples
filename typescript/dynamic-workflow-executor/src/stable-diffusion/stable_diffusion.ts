import * as restate from "@restatedev/restate-sdk";
import * as stableDiffusionGenerator from "./stable_diffusion_generator";
import * as stableDiffusionTransformer from "./stable_diffusion_transformer";

restate
    .createServer()
    .bindRouter(stableDiffusionGenerator.service.path, stableDiffusionGenerator.router)
    .bindRouter(stableDiffusionTransformer.service.path, stableDiffusionTransformer.router)
    .listen(9082);