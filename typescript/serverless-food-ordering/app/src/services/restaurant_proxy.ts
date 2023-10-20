import * as restate from "@restatedev/restate-sdk";
import axios from "axios";

const RESTAURANT_ENDPOINT =
    process.env.RESTAURANT_ENDPOINT || "http://localhost:5050";

// When the order workflow service is deployed on Lambda, it cannot reach our local restaurant POS server on localhost:5050.
// So for Lambda deployments, we let the workflow service send the message to this proxy service that will run locally
// and will forward the request to the restaurant.
// In a real-world scenario the Lambda function would send a request straight to the POS server of the restaurant.
const prepare = async (
    ctx: restate.RpcContext,
    orderId: string,
    cb: string
) => {
    await axios.post(
        `${RESTAURANT_ENDPOINT}/prepare`,
        {
            cb,
            orderId,
        },
        {
            headers: {
                "Content-Type": "application/json"
            },
        }
    );
};
export const router = restate.keyedRouter({
    prepare
});
export type lambdaToRestaurantProxy = typeof router;
export const service: restate.ServiceApi<lambdaToRestaurantProxy> = {
    path: "restaurant",
};