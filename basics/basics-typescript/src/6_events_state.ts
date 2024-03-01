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

//
// Populate state from events (from Kafka).
// Query the state via simple RPC/HTTP calls.
//

const profileService = restate.keyedRouter({
  registration: restate.keyedEventHandler(
    async (ctx: restate.KeyedContext, event: restate.Event) => {
      // store in state the user's information as coming from the registeration event
      const { name } = event.json<{ name: string }>();
      ctx.set("name", name);
    }
  ),

  email: restate.keyedEventHandler(async (ctx: restate.KeyedContext, event: restate.Event) => {
    // store in state the user's information as coming from the email event
    const { email } = event.json<{ email: string }>();
    ctx.set("email", email);
  }),

  get: async (ctx: restate.KeyedContext, id: string): Promise<UserProfile> => {
    return {
      id,
      name: (await ctx.get<string>("name")) ?? "",
      email: (await ctx.get<string>("email")) ?? "",
    };
  },
});

type UserProfile = {
  id: string;
  name: string;
  email: string;
};
