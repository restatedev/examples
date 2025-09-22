import random
import restate
import uuid

from datetime import timedelta, datetime
from restate import TerminalError

from app.types import PaymentRequest, PurchaseTicketRequest


def fail_on_netflix(subscription: str):
    if subscription == "Netflix":
        message = '[👻 SIMULATED] "Netflix subscription failed: Netflix API down..."'
        print(message)
        raise Exception(message)


def terminal_error_on_disney(subscription: str):
    if subscription == "Disney":
        message = '[👻 SIMULATED] "Disney subscription is not available in this region"'
        print(message)
        raise TerminalError(message)


# <start_subscription>
def create_subscription(user_id: str, subscription: str, payment_ref: str) -> str:
    fail_on_netflix(subscription)
    terminal_error_on_disney(subscription)
    print(f">>> Created subscription {subscription} for user {user_id}")
    return "SUCCESS"


# <end_subscription>


def create_recurring_payment(credit_card: str, payment_id: str) -> str:
    """Mock function to create recurring payment"""
    print(f">>> Creating recurring payment for payment {payment_id}")
    return f"payRef-{uuid.uuid4()}"


def send_notification(greeting_id: str, name: str):
    if random.random() < 0.7 and name == "Alice":  # 70% chance of failure
        print(f"[👻 SIMULATED] Failed to send notification: {greeting_id} - {name}")
        raise Exception(
            f"[👻 SIMULATED] Failed to send notification: {greeting_id} - {name}"
        )
    print(f"Notification sent: {greeting_id} - {name}")


def send_reminder(greeting_id: str, name: str):
    if random.random() < 0.7 and name == "Alice":  # 70% chance of failure
        print(f"[👻 SIMULATED] Failed to send reminder: {greeting_id}")
        raise Exception(f"[👻 SIMULATED] Failed to send reminder: {greeting_id}")
    print(f"Reminder sent: {greeting_id}")


def day_before(concert_date: str) -> timedelta:
    """Calculate delay until day before concert - equivalent to Utils.dayBefore"""
    try:
        # Parse concert date
        concert_datetime = datetime.fromisoformat(concert_date)

        # Ensure both datetimes have the same timezone awareness
        if concert_datetime.tzinfo is not None:
            # Concert date is timezone-aware, make now timezone-aware too
            from datetime import timezone

            now = datetime.now(timezone.utc)
            if concert_datetime.tzinfo != timezone.utc:
                # Convert concert_datetime to UTC for consistent comparison
                concert_datetime = concert_datetime.astimezone(timezone.utc)
        else:
            # Concert date is timezone-naive, use naive datetime for now
            now = datetime.now()

        # Calculate delay until day before concert
        one_day_before = concert_datetime - timedelta(days=1)
        delay = one_day_before - now

        if delay.total_seconds() < 0:
            print(f"Reminder date is in the past, cannot schedule reminder.")
            return timedelta(0)

        print(f"Scheduling reminder for {concert_date} with delay {delay}")
        return delay

    except ValueError as e:
        print(f"Invalid date format: {concert_date}")
        return timedelta(0)


def init_payment(req: PaymentRequest, payment_id: str, confirmation_id: str) -> str:
    """Mock function to initiate payment"""
    print(f">>> Initiating external payment {payment_id}")
    print(f"  Confirm the payment via:")
    print(
        f'  - For Payments service: curl localhost:8080/Payments/confirm --json \'{{"id": "{confirmation_id}", "result": {{"success": true, "transactionId": "txn-123"}}}}\''
    )
    print(
        f'  - For PaymentsWithTimeout service: curl localhost:8080/PaymentsWithTimeout/confirm --json \'{{"id": "{confirmation_id}", "result": {{"success": true, "transactionId": "txn-123"}}}}\''
    )
    return f"payRef-{uuid.uuid4()}"


def cancel_payment(pay_ref: str):
    """Mock function to cancel payment"""
    print(f">>> Canceling external payment with ref {pay_ref}")


def remove_recurring_payment(payment_id: str):
    """Mock function to remove recurring payment"""
    print(f"Removing recurring payment: {payment_id}")


def remove_subscription(user_id: str, subscription: str):
    """Mock function to remove subscription"""
    print(f"Removing subscription for user: {user_id}, subscription: {subscription}")


# Payment Service
payment_service = restate.Service("PaymentService")


@payment_service.handler()
async def charge(ctx: restate.Context, req: PurchaseTicketRequest) -> str:
    # Simulate payment processing
    payment_id = str(ctx.uuid())
    print(f"Processing payment for ticket {req.ticket_id} with payment ID {payment_id}")
    return payment_id


# Email Service
email_service = restate.Service("EmailService")


@email_service.handler()
async def email_ticket(ctx: restate.Context, req: PurchaseTicketRequest) -> None:
    print(f"Sending ticket to {req.customer_email} for concert on {req.concert_date}")


@email_service.handler()
async def send_reminder_email(ctx: restate.Context, req: PurchaseTicketRequest) -> None:
    print(f"Sending reminder for concert on {req.concert_date} to {req.customer_email}")
