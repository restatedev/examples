import restate

from example.cart_object import cart
from example.checkout_service import checkout
from example.ticket_object import ticket

app = restate.app(services=[cart, checkout, ticket])
