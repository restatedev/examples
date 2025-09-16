import restate
from restate import WorkflowContext, TerminalError
from app.utils import (
    User,
    create_user,
    delete_user,
    activate_user,
    deactivate_user,
    subscribe_to_paid_plan,
    cancel_subscription,
)

signup_with_sagas = restate.Workflow("SignupWithSagasWorkflow")


@signup_with_sagas.main()
async def run(ctx: WorkflowContext, user: User) -> bool:
    user_id = ctx.key()
    compensations = []

    try:
        compensations.append(
            lambda: ctx.run_typed("delete", delete_user, user_id=user_id)
        )
        await ctx.run_typed("create", create_user, user_id=user_id, user=user)

        compensations.append(
            lambda: ctx.run_typed("deactivate", deactivate_user, user_id=user_id)
        )
        await ctx.run_typed("activate", activate_user, user_id=user_id)

        compensations.append(
            lambda: ctx.run_typed("unsubscribe", cancel_subscription, user=user)
        )
        await ctx.run_typed("subscribe", subscribe_to_paid_plan, user=user)
    except TerminalError:
        # Run compensations in reverse order
        for compensation in reversed(compensations):
            await compensation()
        return False

    return True
