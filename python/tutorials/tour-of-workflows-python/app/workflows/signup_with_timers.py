import restate
from restate import WorkflowContext, WorkflowSharedContext, TerminalError
from datetime import timedelta
from app.utils import (
    User,
    send_verification_email,
    send_reminder_email,
    VerifyEmailRequest,
)

signup_with_timers = restate.Workflow("SignupWithTimersWorkflow")


@signup_with_timers.main()
async def run(ctx: WorkflowContext, user: User) -> bool:
    user_id = ctx.key()

    secret = str(ctx.uuid())
    await ctx.run_typed(
        "verify",
        send_verification_email,
        user_id=user_id,
        user=user,
        verification_secret=secret,
    )

    clicked_promise = ctx.promise("email-verified")
    verification_timeout = ctx.sleep(timedelta(days=1))

    while True:
        reminder_timer = ctx.sleep(timedelta(seconds=15))

        # Wait for email verification, reminder timer or timeout
        result = await restate.select(
            verification=clicked_promise.value(),
            reminder=reminder_timer,
            timeout=verification_timeout,
        )

        match result:
            case ["verification", clicked_secret]:
                return clicked_secret == secret
            case ["reminder", _]:
                await ctx.run_typed(
                    "remind",
                    send_reminder_email,
                    user_id=user_id,
                    user=user,
                    verification_secret=secret,
                )
            case ["timeout", _]:
                raise TerminalError("Email verification timed out after 24 hours")


@signup_with_timers.handler("verifyEmail")
async def verify_email(ctx: WorkflowSharedContext, req: VerifyEmailRequest) -> None:
    await ctx.promise("email-verified").resolve(req.secret)
