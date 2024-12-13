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

import {randomUUID} from "node:crypto";

export type SocialMediaPost = {
    content: string;
    metadata: string;
};

export const PENDING = "PENDING";
export const DONE = "DONE";

export async function createPost(userId: string, post: SocialMediaPost): Promise<{ postId: string, status: string }> {
    const postId = randomUUID().toString();
    console.info(`Created post ${postId} for user ${userId}`);
    return {postId, status: PENDING}
}

export async function getPostStatus(postId: string): Promise<string> {
    console.info(`Retrieving post status for: ${postId}`);
    return Math.random() < 0.8 ? PENDING : DONE;
}

export async function updateUserFeed(user: string, postId: string) {
    console.info(`Updating the user feed for user ${user} and post ${postId}`);
}
