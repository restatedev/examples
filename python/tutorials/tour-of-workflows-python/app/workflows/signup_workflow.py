import restate
from restate import WorkflowContext
from app.utils import User, create_user, activate_user, send_welcome_email

signup_workflow = restate.Workflow("SignupWorkflow")


@signup_workflow.main()
async def run(ctx: WorkflowContext, user: User) -> bool:
    user_id = ctx.key()  # workflow ID = user ID

    # Write to database
    success = await ctx.run_typed("create", create_user, user_id=user_id, user=user)
    if not success:
        return False

    # Call APIs
    await ctx.run_typed("activate", activate_user, user_id=user_id)
    await ctx.run_typed("welcome", send_welcome_email, user=user)
    return True
