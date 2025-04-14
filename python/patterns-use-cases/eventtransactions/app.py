import restate

from datetime import timedelta

from utils import create_post, get_post_status, update_user_feed, SocialMediaPost, Status

# Processing events (from Kafka) to update various downstream systems
#  - Journaling actions in Restate and driving retries from Restate, recovering
#    partial progress
#  - Preserving the order-per-key, but otherwise allowing high-fanout, because
#    processing of events does not block other events.
#  - Ability to delay events when the downstream systems are busy, without blocking
#    entire partitions.
user_feed = restate.VirtualObject("UserFeed")


# The Kafka key routes events to the correct Virtual Object.
# Events with the same key are processed one after the other.
@user_feed.handler("processPost")
async def process_post(ctx: restate.ObjectContext, post: SocialMediaPost):
    user_id = ctx.key()

    # event handler is a durably executed function that can use all the features of Restate
    post_id = await ctx.run("profile update", lambda: create_post(user_id, post))

    # Delay processing until content moderation is complete (handler suspends when on FaaS).
    # This only blocks other posts for this user (Virtual Object), not for other users.

    while await ctx.run("post status", lambda: get_post_status(post_id)) == Status.PENDING:
        await ctx.sleep(timedelta(seconds=5))

    await ctx.run("update feed", lambda: update_user_feed(user_id, post_id))


app = restate.app(services=[user_feed])

if __name__ == "__main__":
    import hypercorn
    import asyncio
    conf = hypercorn.Config()
    conf.bind = ["0.0.0.0:9080"]
    asyncio.run(hypercorn.asyncio.serve(app, conf))

# Process new posts for users via Kafka or by calling the endpoint over HTTP:
# curl localhost:8080/userFeed/userid1/processPost --json '{"content": "Hi! This is my first post!", "metadata": "public"}'
