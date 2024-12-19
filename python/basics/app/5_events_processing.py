from datetime import timedelta
from typing import TypedDict

import restate
from restate import VirtualObject, ObjectContext

from app.utils import update_user_profile, setup_user_permissions, provision_resources

#
# Processing events (from Kafka) to update various downstream systems.
#  - Journaling actions in Restate and driving retries from Restate, recovering
#    partial progress
#  - Preserving the order-per-key, but otherwise allowing high-fanout, because
#    processing of events does not block other events.
#  - Ability to delay events when the downstream systems are busy, without blocking
#    entire partitions.
#

user_updates_object = VirtualObject("userUpdates")


class UserUpdate(TypedDict):
    profile: str
    permissions: str
    resources: str


# uses the Event's key (populated for example from Kafka's key) to route the events to the correct Virtual Object
# and ensure that events with the same key are processed one after the other.
@user_updates_object.handler("updateUserEvent")
async def update_user_event(ctx: ObjectContext, user_update: UserUpdate):
    profile, permissions, resources = user_update["profile"], user_update["permissions"], user_update["resources"]

    # event handler is a durably executed function that can use all the features of Restate
    user_id = await ctx.run("profile update", lambda: update_user_profile(profile))
    while user_id == "NOT READY":
        # Delay the processing of the event by sleeping.
        # The other events for this Virtual Object / key are queued.
        # Events for other keys are processed concurrently.
        # The sleep suspends the function (e.g., when running on FaaS).
        await ctx.sleep(timedelta(seconds=5))
        user_id = await ctx.run("profile update", lambda: update_user_profile(profile))

    role_id = await ctx.run("permissions setup", lambda: setup_user_permissions(user_id, permissions))
    await ctx.run("provision resources", lambda: provision_resources(user_id, role_id, resources))


app = restate.app(services=[user_updates_object])

# Start up Kafka:
# docker-compose up
#
# Run Restate with the Kafka configuration:
# restate-server --config-file restate.toml
#
# Let Restate subscribe to the users topic:
# curl localhost:9070/subscriptions -H 'content-type: application/json' \
#     -d '{
#             "source": "kafka://my-cluster/users",
#             "sink": "service://userUpdates/updateUserEvent",
#             "options": {"auto.offset.reset": "earliest"}
#         }'
#
# You can start a Kafka producer by exec'ing into the Kafka broker:
# docker exec -ti f7381464eaef /bin/bash
#
# kafka-console-producer --bootstrap-server localhost:9092 --topic users --property "parse.key=true" --property "key.separator=:"
#
# Publish the following event to Kafka:
# userid1:{"profile": "dev", "permissions": "all", "resources": "all"}
#
# Alternatively, you can update users by calling the endpoint via HTTP:
# curl localhost:8080/userUpdates/userid1/updateUserEvent --json '{"profile": "dev", "permissions": "all", "resources": "all"}'
