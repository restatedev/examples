import restate
from restate import WorkflowContext, TerminalError
from datetime import timedelta
from app.utils import User, create_user, activate_user, send_welcome_email

signup_with_retries = restate.Workflow("SignupWithRetriesWorkflow")


@signup_with_retries.main()
async def run(ctx: WorkflowContext, user: User) -> bool:
    user_id = ctx.key()

    success = await ctx.run_typed("create", create_user, user_id=user_id, user=user)
    if not success:
        return False

    await ctx.run_typed("activate", activate_user, user_id=user_id)

    # Configure retry policy
    try:
        await ctx.run_typed(
            "welcome",
            send_welcome_email,
            restate.RunOptions(
                max_attempts=3, max_retry_duration=timedelta(seconds=30)
            ),
            user=user,
        )
    except TerminalError as error:
        # This gets hit on retry exhaustion with a terminal error
        # Log and continue; without letting the workflow fail
        print(f"Failed to send welcome email after retries: {error}")

    return True
