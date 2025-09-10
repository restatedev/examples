import restate
from restate import TerminalError
from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel as camelize


class User(BaseModel):
    name: str
    email: str


def fail_on_alice(name: str, action: str):
    if name == "Alice":
        print(f"[👻 SIMULATED] Failed to {action}: {name}")
        raise Exception(f"[👻 SIMULATED] Failed to {action}: {name}")


def terminal_error_on_alice(name: str, action: str):
    if name == "Alice":
        print(
            f"[👻 SIMULATED] Failed to {action} for {name}: not available in this country"
        )
        raise TerminalError(
            f"[👻 SIMULATED] Failed to {action} for {name}: not available in this country"
        )


# <start_here>
def send_welcome_email(user: User):
    fail_on_alice(user.name, "send welcome email")
    print(f"Welcome email sent: {user.email}")


# <end_here>


def create_user(user_id: str, user: User) -> bool:
    print(f"User entry created in DB: {user_id}")
    return True


def delete_user(user_id: str) -> bool:
    print(f"User entry deleted in DB: {user_id}")
    return True


def send_verification_email(user_id: str, user: User, verification_secret: str):
    print(f"Verification email sent: {user.email}")
    print(
        f'For the signals section, verify via: curl localhost:8080/SignupWithSignalsWorkflow/{user_id}/verifyEmail --json \'{{"secret": "{verification_secret}"}}\''
    )
    print(
        f'For the timers section, verify via: curl localhost:8080/SignupWithTimersWorkflow/{user_id}/verifyEmail --json \'{{"secret": "{verification_secret}"}}\''
    )


def send_reminder_email(user: User):
    print(f"Reminder email sent: {user.email}")


def activate_user(user_id: str):
    print(f"User account activated: {user_id}")


def deactivate_user(user_id: str):
    print(f"User account deactivated: {user_id}")


def subscribe_to_paid_plan(user: User) -> bool:
    terminal_error_on_alice(user.name, "subscribe to paid plan")
    print(f"User subscribed to paid plan: {user.name}")
    return True


def cancel_subscription(user: User) -> bool:
    print(f"User subscription cancelled: {user.name}")
    return True


class CreateUserRequest(BaseModel):
    model_config = ConfigDict(populate_by_name=True, alias_generator=camelize)
    user_id: str
    user: User


class VerifyEmailRequest(BaseModel):
    secret: str


# Response models
class WorkflowResult(BaseModel):
    success: bool


class EmailServiceResponse(BaseModel):
    success: bool
    message: str


class StatusResponse(BaseModel):
    status: str | None
    user: dict | None


# Services
email_service = restate.Service("EmailService")


@email_service.handler()
async def send_welcome_handler(
    ctx: restate.Context, user: User
) -> EmailServiceResponse:
    await ctx.run_typed("send_welcome_email", send_welcome_email, user=user)
    return EmailServiceResponse(success=True, message="Email sent successfully")


user_service = restate.Service("UserService")


@user_service.handler()
async def create_user_handler(ctx: restate.Context, req: CreateUserRequest) -> bool:
    return await ctx.run_typed(
        "create_user", create_user, user_id=req.user_id, user=req.user
    )
