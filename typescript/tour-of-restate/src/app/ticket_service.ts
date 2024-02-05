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

enum TicketStatus {
  Available,
  Reserved,
  Sold,
}

const reserve = async (ctx: restate.RpcContext) => {
  return true;
};

const unreserve = async (ctx: restate.RpcContext) => {
  return true;
};

const markAsSold = async (ctx: restate.RpcContext) => {
  return true;
};

export const ticketDbRouter = restate.keyedRouter({ reserve, unreserve, markAsSold });

export const ticketServiceApi: restate.ServiceApi<typeof ticketDbRouter> = {
  path: "TicketService",
};
