import uuid
from typing import TypedDict

import restate
from restate import Workflow, WorkflowContext, WorkflowSharedContext
from restate.exceptions import TerminalError

from app.utils import create_user_entry, send_email_with_link


class Signup(TypedDict):
    user_id: str
    email: str


user_signup = Workflow("usersignup")


@user_signup.main()
async def run(ctx: WorkflowContext, signup: Signup):

    # publish state, for the world to see our progress
    ctx.set("stage", "Creating user")

    # use all the standard durable execution features here
    await ctx.run("create_user", lambda: create_user_entry(signup))

    ctx.set("stage", "Verifying email")

    # send the email with the verification secret
    secret = await ctx.run("secret", lambda: str(uuid.uuid4()))
    await ctx.run("send_email", lambda: send_email_with_link(signup["email"], secret))

    try:
        # the promise here is resolved or rejected by the additional workflow methods below
        click_secret = await ctx.promise("email_link").value()
        if click_secret != secret:
            raise TerminalError("Wrong secret from email link")
    except TerminalError as e:
        ctx.set("stage", "Email verification failed")

    ctx.set("stage", "Email verified")


@user_signup.handler()
async def get_stage(ctx: WorkflowSharedContext) -> str:
    # read the state to get the stage where the workflow is
    return await ctx.get("stage")


@user_signup.handler("verifyEmail")
async def verify_email(ctx: WorkflowContext, secret: str):
    # resolve the durable promise to let the awaiter know
    await ctx.promise("email_link").resolve(secret)


@user_signup.handler("abortVerification")
async def abort_verification(ctx: WorkflowContext):
    # failing the durable promise will throw an Error for the awaiting thread
    await ctx.promise("email_link").reject("User aborted verification")


app = restate.app(services=[user_signup])

# You can deploy this as a container, Lambda, etc.
# Invoke it over HTTP via:
# curl localhost:8080/usersignup/signup-userid1/run/send --json '{ "name": "Bob", "email": "bob@builder.com" }'
#
# Resolve the email link via:
# curl localhost:8080/usersignup/signup-userid1/verifyEmail
# Abort the email verification via:
# curl localhost:8080/usersignup/signup-userid1/abortVerification
