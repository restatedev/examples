package my.example.eventtransactions.utils

import java.util.UUID
import my.example.eventtransactions.UserFeed
import org.apache.logging.log4j.LogManager
import org.apache.logging.log4j.Logger

private val logger: Logger = LogManager.getLogger("UserFeed")

fun createPost(userId: String, post: UserFeed.SocialMediaPost): String {
  val postId = UUID.randomUUID().toString()
  logger.info("Creating post {} for user {}", postId, userId)
  return postId
}

fun getPostStatus(postId: String): String {
  return if (Math.random() < 0.8) {
    logger.info(
        "Content moderation for post {} is still pending... Will check again in 5 seconds", postId)
    "PENDING"
  } else {
    logger.info("Content moderation for post {} is done", postId)
    "DONE"
  }
}

fun updateUserFeed(userId: String, postId: String) {
  logger.info("Updating user feed for user {} with post {}", userId, postId)
}
