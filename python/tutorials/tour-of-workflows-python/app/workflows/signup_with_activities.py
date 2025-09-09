import restate
from restate import WorkflowContext
from app.utils import User, activate_user, send_welcome_email, CreateUserRequest
from app.utils import create_user_handler

signup_with_activities = restate.Workflow("SignupWithActivitiesWorkflow")


@signup_with_activities.main()
async def run(ctx: WorkflowContext, user: User) -> bool:
    user_id = ctx.key()

    # Move user DB interaction to dedicated service
    success = await ctx.service_call(
        create_user_handler, arg=CreateUserRequest(user_id=user_id, user=user)
    )
    if not success:
        return success

    # Execute other steps inline
    await ctx.run_typed("activate", activate_user, user_id=user_id)
    await ctx.run_typed("welcome", send_welcome_email, user=user)
    return success
