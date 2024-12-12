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

import { TerminalError } from "@restatedev/restate-sdk";

export type UserUpdate = {
    profile: string;
    permissions: string;
    resources: string;
};

export const NOT_READY = "NOT_READY";

export async function updateUserProfile(profile: string, token?: string): Promise<string> {
    return Math.random() < 0.8 ? NOT_READY : profile + "-id";
}
export async function setupUserPermissions(
    id: string,
    permissions: string,
    token?: string
): Promise<string> {
    return permissions;
}
export async function provisionResources(user: string, role: string, resources: string) {}

export function verifyEvent(request: UserUpdate): UserUpdate {
    if (request?.profile && request?.permissions && request?.resources) {
        return request;
    } else {
        throw new TerminalError("Incomplete event");
    }
}
