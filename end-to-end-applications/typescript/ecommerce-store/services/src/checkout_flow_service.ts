/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

import * as restate from "@restatedev/restate-sdk";
import {
  AppendPurchaseHistoryRequest,
  ChargeRequest,
  CheckoutFlowRequest,
  CheckoutFlowService,
  CheckoutResponse,
  CheckoutResponse_CheckoutSuccess,
  CheckoutResponse_DeliveryAvailabilityFailure,
  CheckoutResponse_PaymentFailure,
  EmailSenderClientImpl,
  GetUserProfileRequest,
  NotifyProductSoldEvent,
  PaymentGatewayClientImpl,
  PrepareShipmentRequest,
  ProductServiceClientImpl,
  ReleaseRequest,
  Reservation,
  SendEmailRequest,
  ShipmentServiceClientImpl,
  UserProfileServiceClientImpl,
} from "./generated/proto/shoppingcart";
import { Empty } from "./generated/proto/google/protobuf/empty";

export class CheckoutFlowSvc implements CheckoutFlowService {
  async start(request: CheckoutFlowRequest): Promise<CheckoutResponse> {
    const ctx = restate.useContext(this);

    const userProfileClient = new UserProfileServiceClientImpl(ctx.grpcChannel());
    const paymentClient = new PaymentGatewayClientImpl(ctx.grpcChannel());
    const shipmentClient = new ShipmentServiceClientImpl(ctx.grpcChannel());
    const emailClient = new EmailSenderClientImpl(ctx.grpcChannel());

    const products = new Products(request.reservedProducts, ctx);

    // ---------------------------------------------------------------------------------------
    // 1. get the user information
    // ---------------------------------------------------------------------------------------
    const user = await userProfileClient.getUserProfile(
      GetUserProfileRequest.create({ userId: request.userId })
    );

    // ---------------------------------------------------------------------------------------
    // 2. calculate the shipment cost
    // ---------------------------------------------------------------------------------------
    const shipment = await shipmentClient.prepareShipment(
      PrepareShipmentRequest.create({
        targetAddress: user.shippingAddress,
        productIds: products.getProductIds(),
      })
    );

    if (!shipment.success) {
      await products.releaseReservations();
      return CheckoutResponse.create({
        deliveryAvailabilityFailure:
          CheckoutResponse_DeliveryAvailabilityFailure.create(),
      });
    }

    // ---------------------------------------------------------------------------------------
    // 3. make the payment
    // ---------------------------------------------------------------------------------------
    const amount = shipment.shipmentCost + products.getShoppingCartCost();
    const paymentTransactionId = request.userId + "." + request.shoppingCartId;
    const payment = await paymentClient.charge(
      ChargeRequest.create({
        amount: amount,
        paymentMethodIdentifier: user.paymentMethodIdentifier,
        transactionId: paymentTransactionId,
      })
    );

    if (!payment.success) {
      await products.releaseReservations();
      return CheckoutResponse.create({
        paymentFailure: CheckoutResponse_PaymentFailure.create(),
      });
    }

    // ---------------------------------------------------------------------------------------
    // 4. send a success email
    // ---------------------------------------------------------------------------------------
    await emailClient.sendEmail(
      SendEmailRequest.create({
        emailAddress: user.emailAddress,
        content: this.succesMessage(),
      })
    );

    // ---------------------------------------------------------------------------------------
    // 5. add products to the user's purchase history
    // ---------------------------------------------------------------------------------------
    await userProfileClient.appendPurchaseHistory(
      AppendPurchaseHistoryRequest.create({
        userId: user.userId,
        purchaseHistory: products.getProductIds(),
      })
    );

    // ---------------------------------------------------------------------------------------
    // 6. Let all the products know that they were bought
    // ---------------------------------------------------------------------------------------
    await products.notifySuccessfulPurchase();

    // ---------------------------------------------------------------------------------------
    // 7. Reply to our caller
    // ---------------------------------------------------------------------------------------
    return CheckoutResponse.create({
      checkoutSuccess: CheckoutResponse_CheckoutSuccess.create({
        trackingNumber: shipment.trackingNumber,
      }),
    });
  }

  succesMessage() {
    return "Your purchase was successful!";
  }
}

class Products {
  private products: Reservation[];
  private productServiceClient;

  constructor(products: Reservation[], ctx: restate.Context) {
    this.products = products;
    this.productServiceClient = new ProductServiceClientImpl(ctx.grpcChannel());
  }

  getProductIds(): string[] {
    return this.products.map((el) => el.productId);
  }

  getShoppingCartCost(): number {
    return this.products
      .map((el) => el.priceInCents)
      .reduce((sum, current) => sum + current, 0);
  }

  async releaseReservations() {
    const releasePromises: Promise<Empty>[] = [];
    this.getProductIds().forEach((id) =>
      releasePromises.push(
        this.productServiceClient.release(
          ReleaseRequest.create({ productId: id })
        )
      )
    );
    await Promise.all(releasePromises);
  }

  async notifySuccessfulPurchase() {
    const soldPromises: Promise<Empty>[] = [];
    this.getProductIds().forEach((id) => {
      soldPromises.push(
        this.productServiceClient.notifyProductSold(
          NotifyProductSoldEvent.create({ productId: id })
        )
      );
    });
    await Promise.all(soldPromises);
  }
}
