import * as restate from "@restatedev/restate-sdk/fetch";

export const serveRestate = (endpoint: ReturnType<typeof restate.endpoint>) => {
  const { fetch } = endpoint.handler();
  return {
    POST: (req: Request) => fetch(req),
    GET: (req: Request) => fetch(req),
  };
};
