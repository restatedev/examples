# Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
#
# This file is part of the Restate examples,
# which is released under the MIT license.
#
# You can find a copy of the license in the file LICENSE
# in the root directory of this repository or package or at
# https://github.com/restatedev/examples/

import restate

from tour.part4.cart_object import cart
from tour.part4.checkout_service import checkout
from tour.part4.ticket_object import ticket

app = restate.app(services=[cart, checkout, ticket])
