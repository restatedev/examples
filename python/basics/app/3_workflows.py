import uuid
import restate
from pydantic import BaseModel
from restate import Workflow, WorkflowContext, WorkflowSharedContext
from app.utils import create_user_entry, send_email_with_link

"""
Workflow for user signup and email verification.
 - Main workflow in run() method
 - Additional methods interact with the workflow.
Each workflow instance has a unique ID and runs only once (to success or failure).
"""
user_signup = Workflow("usersignup")


class User(BaseModel):
    name: str
    email: str


#  --- The workflow logic ---
@user_signup.main()
async def run(ctx: WorkflowContext, user: User) -> bool:
    # workflow ID = user ID; workflow runs once per user
    user_id = ctx.key()

    # Durably executed action; write to other system
    async def create_user():
        return await create_user_entry(user)
    await ctx.run("create_user", create_user)

    # Send the email with the verification link
    secret = await ctx.run("secret", lambda: str(uuid.uuid4()))
    await ctx.run("send_email", lambda: send_email_with_link(user_id, user.email, secret))

    # Wait until user clicked email verification link
    # Promise gets resolved or rejected by the other handlers
    click_secret = await ctx.promise("email_link").value()
    return click_secret == secret


#  --- Other handlers interact with the workflow via queries and signals ---
@user_signup.handler()
async def click(ctx: WorkflowSharedContext, secret: str):
    # Send data to the workflow via a durable promise
    await ctx.promise("email_link").resolve(secret)

app = restate.app(services=[user_signup])

"""
You can deploy this as a container, Lambda, etc. - Invoke it over HTTP via: curl
localhost:8080/usersignup/signup-userid1/run/send -H 'content-type: application/json' \
      -d '{ "name": "Bob", "email": "bob@builder.com" }'

- Resolve the email link via:
  curl localhost:8080/usersignup/signup-userid1/verifyEmail

- Attach back to the workflow to get the result:
  curl localhost:8080/restate/workflow/usersignup/userid1/attach
"""