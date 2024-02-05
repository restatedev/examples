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
  CreateUserProfileRequest,
  GetUserProfileRequest,
  UserProfile,
  UserProfileService,
} from "./generated/proto/shoppingcart";
import { Empty } from "./generated/proto/google/protobuf/empty";
import { TerminalError } from "@restatedev/restate-sdk";

export class UserProfileSvc implements UserProfileService {
  async createUserProfile(request: CreateUserProfileRequest): Promise<Empty> {
    const ctx = restate.useContext(this);

    ctx.set("profile", request.userProfile);

    return Empty.create();
  }

  async getUserProfile(_request: GetUserProfileRequest): Promise<UserProfile> {
    const ctx = restate.useContext(this);

    const profile = await ctx.get<UserProfile>("profile");

    if (!profile) {
      throw new TerminalError("User profile does not exist");
    }

    return profile;
  }

  async appendPurchaseHistory(
    request: AppendPurchaseHistoryRequest
  ): Promise<Empty> {
    const ctx = restate.useContext(this);

    const profile =
      (await ctx.get<UserProfile>("profile")) || UserProfile.create({});

    profile.purchaseHistory.push(...request.purchaseHistory);

    ctx.set("profile", profile);

    return Empty.create();
  }
}
