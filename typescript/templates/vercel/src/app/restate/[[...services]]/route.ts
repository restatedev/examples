import { serve } from "@/restate/serve";

// This is the route that exposes the Restate services.
// You can register it to Restate using /restate subpath (check the README)
// To call it, open Restate > Overview > Greeter > Playground
export const { GET, POST } = serve();
