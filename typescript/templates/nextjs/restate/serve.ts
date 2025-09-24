import * as restate from "@restatedev/restate-sdk/fetch";
import { greeter } from "@/restate/greeter";

// Create the Restate endpoint. 
// Here you need to register your services
const endpoint = restate.createEndpointHandler({ services: [greeter] });

// Adapt it to Next.js route handlers
export const serve = () => {
  return {
    POST: (req: Request) => endpoint(req),
    GET: (req: Request) => endpoint(req),
  };
};
