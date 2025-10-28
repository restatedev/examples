import restate
from restate import WorkflowContext, WorkflowSharedContext
from app.utils import User, send_verification_email, VerifyEmailRequest

signup_with_signals = restate.Workflow("SignupWithSignalsWorkflow")


@signup_with_signals.main()
async def run(ctx: WorkflowContext, user: User) -> bool:
    user_id = ctx.key()

    # Generate verification secret and send email
    secret = str(ctx.uuid())
    await ctx.run_typed(
        "verify",
        send_verification_email,
        user_id=user_id,
        user=user,
        verification_secret=secret,
    )

    # Wait for user to click verification link
    clicked_secret = await ctx.promise("email-verified", type_hint=str).value()
    return clicked_secret == secret


@signup_with_signals.handler("verifyEmail")
async def verify_email(ctx: WorkflowSharedContext, req: VerifyEmailRequest) -> None:
    # Resolve the promise to continue the main workflow
    await ctx.promise("email-verified", type_hint=str).resolve(req.secret)
