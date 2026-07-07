package my.example.eventtransactions

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.http.vertx.RestateHttpServer
import dev.restate.sdk.kotlin.*
import dev.restate.sdk.kotlin.endpoint.endpoint
import kotlin.time.Duration.Companion.milliseconds
import kotlinx.serialization.Serializable
import my.example.eventtransactions.utils.createPost
import my.example.eventtransactions.utils.getPostStatus
import my.example.eventtransactions.utils.updateUserFeed

@VirtualObject
class UserFeed {

  @Serializable data class SocialMediaPost(val content: String, val metadata: String)

  @Handler
  suspend fun processPost(post: SocialMediaPost) {
    val userId = objectKey()

    val postId = runBlock { createPost(userId, post) }

    while (runBlock { getPostStatus(postId) } == "PENDING") {
      sleep(5000.milliseconds)
    }

    runBlock { updateUserFeed(userId, postId) }
  }
}

fun main() {
  RestateHttpServer.listen(endpoint { bind(UserFeed()) })
}
