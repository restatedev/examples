import * as restate from "@restatedev/restate-sdk-clients";
import { Opts } from "@restatedev/restate-sdk-clients";
import express, { Request, Response } from "express";
import { ProductService } from "./product_service";

const app = express();

const RESTATE_URL = "http://localhost:8080";
const restateClient = restate.connect({ url: RESTATE_URL });

// This example shows how to invoke a handler from plain TypeScript code
// You can also invoke a handler from within a Restate handler.
// Check the service communication docs for more info

app.post("/reserve/:productId/:reservationId", async (req: Request<{ productId: string; reservationId: string }>, res: Response) => {
  const { productId, reservationId } = req.params;

  // Durable RPC call to the product service
  // Restate registers the request and makes sure it runs to completion exactly once
  // This is a call to Virtual Object so we can be sure only one reservation is made concurrently
  const products = restateClient.objectClient<ProductService>({ name: "product" }, productId);
  const reservation = await products.reserve(
    // Restate deduplicates requests with the same idempotency key
    Opts.from({ idempotencyKey: reservationId }),
  );

  res.json({ reserved: reservation });
});

app.listen(5000, () => {
  console.log("Server is running on port 5000");
});
