/*
 * Copyright (c) 2023 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

import * as restate from "@restatedev/restate-sdk";
import { protoMetadata } from "./generated/proto/shoppingcart";
import { CheckoutFlowSvc } from "./checkout_flow_service";
import { EmailSvc } from "./email_service";
import { InventoryRestockSvc } from "./inventory_restock_service";
import { PaymentGatewaySvc } from "./payment_gateway";
import { ShipmentSvc } from "./shipment_service";
import { ProductSvc } from "./product_service";
import { ShoppingCartSvc } from "./shopping_cart_service";
import { UserProfileSvc } from "./user_profile_service";
import { PgProductSvc } from "./pg_product_service";
import { ProductListingSvc } from "./product_listing_service";

let restateServer = restate
  .createServer()
  .bindService({
    descriptor: protoMetadata,
    service: "CheckoutFlowService",
    instance: new CheckoutFlowSvc(),
  })
  .bindService({
    descriptor: protoMetadata,
    service: "EmailSender",
    instance: new EmailSvc(),
  })
  .bindService({
    descriptor: protoMetadata,
    service: "InventoryRestockService",
    instance: new InventoryRestockSvc(),
  })
  .bindService({
    descriptor: protoMetadata,
    service: "PaymentGateway",
    instance: new PaymentGatewaySvc(),
  })
  .bindService({
    descriptor: protoMetadata,
    service: "ShipmentService",
    instance: new ShipmentSvc(),
  })
  .bindService({
    descriptor: protoMetadata,
    service: "ShoppingCartService",
    instance: new ShoppingCartSvc(),
  })
  .bindService({
    descriptor: protoMetadata,
    service: "UserProfileService",
    instance: new UserProfileSvc(),
  });

// When we run locally, we don't use a database to store the products
if (process.env.DATABASE_ENABLED === "true") {
  restateServer = restateServer
    .bindService({
      descriptor: protoMetadata,
      service: "ProductService",
      instance: new PgProductSvc(),
    })
    .bindService({
      descriptor: protoMetadata,
      service: "ProductListingService",
      instance: new ProductListingSvc(),
    });
} else {
  restateServer = restateServer.bindService({
    descriptor: protoMetadata,
    service: "ProductService",
    instance: new ProductSvc(),
  });
}

restateServer.listen(8080);
