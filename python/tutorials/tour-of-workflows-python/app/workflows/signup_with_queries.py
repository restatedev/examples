import restate
from restate import WorkflowContext, WorkflowSharedContext
from app.utils import (
    User,
    StatusResponse,
    create_user,
    activate_user,
    send_welcome_email,
)

signup_with_queries = restate.Workflow("SignupWithQueriesWorkflow")


@signup_with_queries.main()
async def run(ctx: WorkflowContext, user: User) -> bool:
    user_id = ctx.key()

    ctx.set("user", user.model_dump())
    success = await ctx.run_typed("create", create_user, user_id=user_id, user=user)
    if not success:
        ctx.set("status", "failed")
        return success
    ctx.set("status", "created")

    await ctx.run_typed("activate", activate_user, user_id=user_id)
    await ctx.run_typed("welcome", send_welcome_email, user=user)
    return success


@signup_with_queries.handler()
async def get_status(ctx: WorkflowSharedContext) -> StatusResponse:
    return StatusResponse(status=await ctx.get("status"), user=await ctx.get("user"))
