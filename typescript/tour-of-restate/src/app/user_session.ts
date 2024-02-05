/*
 * Copyright (c) 2023 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Tour of Restate Typescript handler API,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/tour-of-restate
 */

import * as restate from "@restatedev/restate-sdk";

const addTicket = async (
  ctx: restate.RpcContext,
  userId: string,
  ticketId: string,
) => {
  return true;
};

const expireTicket = async (
  ctx: restate.RpcContext,
  userId: string,
  ticketId: string,
) => {};

const checkout = async (ctx: restate.RpcContext, userId: string) => {
  return true;
};

export const userSessionRouter = restate.keyedRouter({ addTicket, expireTicket, checkout});

export const userSessionApi: restate.ServiceApi<typeof userSessionRouter> = {
  path: "UserSession",
};
