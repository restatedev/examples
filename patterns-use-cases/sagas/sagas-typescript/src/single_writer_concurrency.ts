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

//  -----------------                                         -----------------
//                          Single-writer concurrency
//  -----------------                                         -----------------
//
// The single-writer pattern ensures that for a specific entity, only a single
// request handler at a time would be able to touch it and make changes.
//
// Restate implements this naturally with keyed handlers. All handlers on the same
// keyed router are mutually exclusive for a specific key.
//
// In this example, the only one of the three handlers can run at the same time
// for a specific user.

const userServiceImpl = {

    updateUser: async (ctx: restate.RpcContext, userId: string, updateRequest: any) => {
        // ...
    },

    moveUser: async (ctx: restate.RpcContext, userId: string, moveRequest: any) => {
        // ...
    },

    deleteUser: async (ctx: restate.RpcContext, userId: string) => {
        // ...
    }
}

const userService = restate.keyedRouter(userServiceImpl);
