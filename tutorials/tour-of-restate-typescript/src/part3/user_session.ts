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

import * as restate from "@restatedev/restate-sdk";
import { ticketServiceApi } from "./ticket_service";
import { checkoutApi } from "./checkout";

const addTicket = async (
  ctx: restate.RpcContext,
  userId: string,
  ticketId: string,
) => {
  const reservationSuccess = await ctx.rpc(ticketServiceApi).reserve(ticketId);

  if (reservationSuccess) {
    const tickets = (await ctx.get<string[]>("tickets")) ?? [];
    tickets.push(ticketId);
    ctx.set("tickets", tickets);

    ctx
      .sendDelayed(userSessionApi, 15 * 60 * 1000)
      .expireTicket(userId, ticketId);
  }

  return reservationSuccess;
};

const expireTicket = async (
  ctx: restate.RpcContext,
  userId: string,
  ticketId: string,
) => {
  const tickets = (await ctx.get<string[]>("tickets")) ?? [];

  const ticketIndex = tickets.findIndex((ticket) => ticket === ticketId);

  if (ticketIndex != -1) {
    tickets.splice(ticketIndex, 1);
    ctx.set("tickets", tickets);

    ctx.send(ticketServiceApi).unreserve(ticketId);
  }
};

const checkout = async (ctx: restate.RpcContext, userId: string) => {
  const tickets = (await ctx.get<string[]>("tickets")) ?? [];

  if (tickets.length === 0) {
    return false;
  }

  const checkoutSuccess = await ctx
    .rpc(checkoutApi)
    .checkout({ userId: userId, tickets: tickets! });

  if (checkoutSuccess) {
    // mark tickets as sold if checkout was successful
    for (const ticketId of tickets) {
      ctx.send(ticketServiceApi).markAsSold(ticketId);
    }
    ctx.clear("tickets");
  }

  return checkoutSuccess;
};

export const userSessionRouter = restate.keyedRouter({ addTicket, expireTicket, checkout});

export const userSessionApi: restate.ServiceApi<typeof userSessionRouter> = {
  path: "UserSession",
};
