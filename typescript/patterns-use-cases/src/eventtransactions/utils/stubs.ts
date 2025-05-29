import { randomUUID } from "node:crypto";

export type SocialMediaPost = {
  content: string;
  metadata: string;
};

export const PENDING = "PENDING";
export const DONE = "DONE";

export async function createPost(
  userId: string,
  post: SocialMediaPost
): Promise<string> {
  const postId = randomUUID().toString();
  console.info(
    `Created post ${postId} for user ${userId} with content: ${post.content}`
  );
  return postId;
}

export async function getPostStatus(postId: string): Promise<string> {
  if (Math.random() < 0.8) {
    console.info(
      `Content moderation for post ${postId} is still pending... Will check again in 5 seconds`
    );
    return PENDING;
  } else {
    console.info(`Content moderation for post ${postId} is done`);
    return DONE;
  }
}

export async function updateUserFeed(user: string, postId: string) {
  console.info(`Updating the user feed for user ${user} with post ${postId}`);
}
