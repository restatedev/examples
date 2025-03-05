package my.example.eventtransactions

import dev.restate.sdk.annotation.Handler
import dev.restate.sdk.annotation.VirtualObject
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder
import dev.restate.sdk.kotlin.ObjectContext
import dev.restate.sdk.kotlin.runBlock
import kotlinx.serialization.Serializable
import my.example.eventtransactions.utils.createPost
import my.example.eventtransactions.utils.getPostStatus
import my.example.eventtransactions.utils.updateUserFeed
import kotlin.time.Duration.Companion.milliseconds

@VirtualObject
class UserFeed {

    @Serializable
    data class SocialMediaPost(val content: String, val metadata: String)

    @Handler
    suspend fun processPost(ctx: ObjectContext, post: SocialMediaPost) {
        val userId = ctx.key()

        val postId = ctx.runBlock { createPost(userId, post) }

        while (ctx.runBlock { getPostStatus(postId) } == "PENDING") {
            ctx.sleep(5000.milliseconds)
        }

        ctx.runBlock { updateUserFeed(userId, postId) }
    }
}

fun main() {
    RestateHttpEndpointBuilder.builder().bind(UserFeed()).buildAndListen()
}

