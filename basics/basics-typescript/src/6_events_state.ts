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

const profileService = restate.object({
  name: "profile",
  handlers: {
    registration: async (
      ctx: restate.ObjectContext,
      event: { name: string }
    ) => {
      // store in state the user's information as coming from the registration event
      ctx.set("name", event.name);
    },

    email: async (ctx: restate.ObjectContext, event: { email: string }) => {
      // store in state the user's information as coming from the email event
      ctx.set("email", event.email);
    },

    get: async (ctx: restate.ObjectContext): Promise<UserProfile> => {
      return {
        id: ctx.key,
        name: (await ctx.get<string>("name")) ?? "",
        email: (await ctx.get<string>("email")) ?? "",
      };
    },
  },
});

type UserProfile = {
  id: string;
  name: string;
  email: string;
};

restate.endpoint().bind(profileService).listen();

// Update and query the state via:
/*
curl localhost:8080/profile/userid1/registration --json '{ "name": "Bob" }'
curl localhost:8080/profile/userid1/email --json '{ "email": "bob@mydomain.com"}'
curl localhost:8080/profile/userid1/get
*/