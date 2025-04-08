from datetime import datetime
import random

from utils.types import FlightPriceOpts


def get_best_quote(trip: FlightPriceOpts, price_threshold: float):

    # We want this to return a match on average every 5 tries, for the sake of
    # using this in an interactive demo.
    # Low prices are  between 0% and 10% below the threshold.
    # High prices are a bit above the price threshold
    price = (
        price_threshold * (1 - (random.random() / 10))
        if random.random() < 0.2
        else price_threshold * (1.01 + 2 * random.random())
    )

    rounded_price = round(price, 2)

    date_string = datetime.now().strftime("%a %b %d %Y")

    return {
        "price": rounded_price,
        "currency": "USD",
        "link": "https://www.google.com/travel/flights/search?tfs=CBw[...]",
        "retrieved": date_string,
    }
