import * as restate from "@restatedev/restate-sdk-clients";
import { Opts } from "@restatedev/restate-sdk-clients";
import express, { Request, Response } from "express";
import { ProductService } from "product-service";

const app = express();

const RESTATE_URL = "http://localhost:8080";
const restateClient = restate.connect({ url: RESTATE_URL });

app.post("/reserve/:productId/:reservationId", async (req: Request, res: Response) => {
    const { productId, reservationId } = req.params;

    // Durable RPC call to the product service
    // Restate registers the request and makes sure runs to completion exactly once
    const products = restateClient
        .objectClient<ProductService>({ name: "product" }, productId);
    const reservation = await products.reserve(
        // Restate deduplicates requests with the same idempotency key
        Opts.from({ idempotencyKey: reservationId })
    );

    console.log("Reservation result", reservation);
    return res.json(reservation);
});

app.listen(5000, () => {
    console.log("Server is running on port 5000");
})
