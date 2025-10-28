import random
import restate

from restate.exceptions import TerminalError
from pydantic import BaseModel


class Result(BaseModel):
    success: bool
    message: str


# A simple virtual object, to track accounts.
# This is for simplicity to make this example work self-contained.
# This should be a database in a real scenario
account = restate.VirtualObject("account")

# The key under which we store the balance
BALANCE = "balance"


@account.handler()
async def deposit(ctx: restate.ObjectContext, amount_cents: int):
    if amount_cents <= 0:
        raise TerminalError("Amount must be greater than 0")

    balance_cents = await ctx.get(BALANCE, type_hint=int) or initialize_random_amount()
    ctx.set(BALANCE, balance_cents + amount_cents)


@account.handler()
async def withdraw(ctx: restate.ObjectContext, amount_cents: int) -> Result:
    if amount_cents <= 0:
        raise TerminalError("Amount must be greater than 0")

    balance_cents = await ctx.get(BALANCE, type_hint=int) or initialize_random_amount()
    if balance_cents < amount_cents:
        return Result(success=False, message=f"Insufficient funds: {balance_cents} cents")

    ctx.set(BALANCE, balance_cents - amount_cents)
    return Result(success=True, message="Withdrawal successful")


def initialize_random_amount() -> int:
    return random.randint(100_000, 200_000)
