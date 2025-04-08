/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate examples,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */

package dev.restate.sdk.examples;

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.examples.types.StatusEnum;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;

@VirtualObject
public class OrderStatusService {

  private static final StateKey<StatusEnum> ORDER_STATUS =
      StateKey.of("order-status", StatusEnum.class);
  private static final StateKey<Long> ORDER_ETA = StateKey.of("order-eta", Long.TYPE);

  public static class OrderStatus {
    private final StatusEnum status;
    private final long eta;

    public OrderStatus(StatusEnum status, long eta) {
      this.status = status;
      this.eta = eta;
    }

    public long getEta() {
      return eta;
    }

    public StatusEnum getStatus() {
      return status;
    }
  }

  /** Gets called by the webUI frontend to display the status of an order. */
  @Handler
  public OrderStatus get(ObjectContext ctx) throws TerminalException {
    var status = ctx.get(ORDER_STATUS).orElse(StatusEnum.NEW);
    var eta = ctx.get(ORDER_ETA).orElse(-1L);
    return new OrderStatus(status, eta);
  }

  @Handler
  public void setStatus(ObjectContext ctx, StatusEnum statusEnum) throws TerminalException {
    ctx.set(ORDER_STATUS, statusEnum);
  }

  @Handler
  public void setETA(ObjectContext ctx, long eta) throws TerminalException {
    ctx.set(ORDER_ETA, eta);
  }
}
