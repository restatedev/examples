import restate
from restate import WorkflowContext, WorkflowSharedContext
from app.utils import User, create_user, activate_user, send_welcome_email

signup_with_events = restate.Workflow("SignupWithEventsWorkflow")


@signup_with_events.main()
async def run(ctx: WorkflowContext, user: User) -> bool:
    user_id = ctx.key()

    success = await ctx.run_typed("create", create_user, user_id=user_id, user=user)
    if not success:
        await ctx.promise("user-created").reject("Creation failed.")
        return False

    await ctx.promise("user-created").resolve("User created.")

    await ctx.run_typed("activate", activate_user, user_id=user_id)
    await ctx.run_typed("welcome", send_welcome_email, user=user)
    return True


@signup_with_events.handler("waitForUserCreation")
async def wait_for_user_creation(ctx: WorkflowSharedContext) -> str:
    return await ctx.promise("user-created").value()
