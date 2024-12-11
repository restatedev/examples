import restate
from restate import VirtualObject, ObjectContext

# Populate state from events (from Kafka).
# Query the state via simple RPC/HTTP calls.
profile_service = VirtualObject("profile")


@profile_service.handler()
async def registration(ctx: ObjectContext, name: str):
    print(name)
    # store in state the user's information as coming from the registration event
    ctx.set("name", name)


@profile_service.handler()
async def email(ctx: ObjectContext, email: str):
    # store in state the user's information as coming from the email event
    ctx.set("email", email)


@profile_service.handler()
async def get(ctx: ObjectContext) -> dict:
    return {
        "id": ctx.key(),
        "name": await ctx.get("name"),
        "email": await ctx.get("email")
    }


app = restate.app(services=[profile_service])


# Start up Kafka:
# docker-compose up
#
# Run Restate with the Kafka configuration:
# restate-server --config-file restate.toml
#
# Let Restate subscribe to the users topic:
# curl localhost:9070/subscriptions -H 'content-type: application/json' \
#     -d '{
#             "source": "kafka://my-cluster/profiles",
#             "sink": "service://profile/registration",
#             "options": {"auto.offset.reset": "earliest"}
#         }'
#
# You can start a Kafka producer by exec'ing into the Kafka broker:
# docker exec -ti f7381464eaef /bin/bash
#
# kafka-console-producer --bootstrap-server localhost:9092 --topic profiles --property "parse.key=true" --property "key.separator=:"
#
# Publish the following event to Kafka:
# userid1:"Bob"
#
# Update and query the state via:
# curl localhost:8080/profile/userid1/email --json '"bob@mydomain.com"'
# curl localhost:8080/profile/userid1/get
