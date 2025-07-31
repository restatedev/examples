import { createEndpointHandler } from "@restatedev/restate-sdk/fetch";

export const serveRestate = (fetch: ReturnType<typeof createEndpointHandler>) => {
  return {
    POST: (req: Request) => fetch(req),
    GET: (req: Request) => fetch(req),
  };
};
