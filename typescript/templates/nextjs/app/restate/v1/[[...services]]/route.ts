import { endpoint } from "@/restate/endpoint";
import { serveRestate } from "@/restate/serve";

export const { GET, POST } = serveRestate(endpoint);
