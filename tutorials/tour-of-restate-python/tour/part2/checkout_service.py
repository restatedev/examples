# Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
#
# This file is part of the Restate examples,
# which is released under the MIT license.
#
# You can find a copy of the license in the file LICENSE
# in the root directory of this repository or package or at
# https://github.com/restatedev/examples/

from typing import TypedDict, List
from restate.context import ObjectContext, Serde
from restate.service import Service

from tour.auxiliary.email_client import EmailClient
from tour.auxiliary.payment_client import PaymentClient


class Order(TypedDict):
    user_id: str
    tickets: List[str]


payment_client = PaymentClient()
email_client = EmailClient()

checkout = Service("CheckoutService")


# <start_checkout>
@checkout.handler()
async def handle(ctx: ObjectContext, order: Order) -> bool:
    return True
# <end_checkout>
