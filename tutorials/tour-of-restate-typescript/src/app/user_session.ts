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

// <start_user_session>
export const userSessionRouter = restate.keyedRouter({
  async addTicket(ctx: restate.KeyedContext, userId: string, ticketId: string){
    return true;
  },

  async expireTicket(ctx: restate.KeyedContext, userId: string, ticketId: string){},

  async checkout(ctx: restate.KeyedContext, userId: string){
    return true;
  },
});
// <end_user_session>

export const userSessionApi: restate.ServiceApi<typeof userSessionRouter> = {
  path: "UserSession",
};
