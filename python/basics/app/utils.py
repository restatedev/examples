import os
import random

import restate

# Utility to let the service crash with a probability to show how the system recovers.
kill_process = bool(os.getenv("CRASH_PROCESS"))


def maybe_crash(probability: float = 0.5) -> None:
    if random.random() < probability:
        print("A failure happened!")
        if kill_process:
            print("--- CRASHING THE PROCESS ---")
            raise SystemExit(1)
        else:
            raise Exception("A failure happened!")


# Simulates calling a subscription API, with a random probability of API downtime.
def create_subscription(user_id: str, subscription: str, payment_ref: str) -> str:
    maybe_crash(0.3)
    print(f">>> Creating subscription {subscription} for user {user_id} and payment ref {payment_ref}")
    return "SUCCESS"


# Simulates calling a payment API, with a random probability of API downtime.
def create_recurring_payment(_credit_card: str, payment_id: str) -> str:
    maybe_crash(0.3)
    print(f">>> Creating recurring payment {payment_id}")
    return "payment-reference"


# Stubs for 2_workflows.py
async def create_user_entry(user):
    print(f"Creating user entry for {user}")


def send_email_with_link(user_id: str, email: str, secret: str):
    print(
        f"Sending email to {email} with secret {secret}. \n"
        f"To simulate a user clicking the link, run the following command: \n"
        f"curl localhost:8080/usersignup/{user_id}/click -H 'content-type: application/json' -d '\"{secret}\"'"
    )


async def charge_bank_account(payment_deduplication_id: str, amount: int) -> bool:
    return True


subscription_service = restate.VirtualObject("SubscriptionService")


@subscription_service.handler()
async def create(ctx: restate.ObjectContext, userId: str) -> str:
    return "SUCCESS"


@subscription_service.handler()
async def cancel(ctx: restate.ObjectContext):
    pass
