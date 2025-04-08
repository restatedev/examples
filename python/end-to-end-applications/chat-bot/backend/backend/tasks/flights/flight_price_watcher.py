import restate
import logging
from datetime import timedelta
from typing import Any

from tasks.flights.utils.api import get_best_quote
from tasks.flights.utils.utils import parse_currency, check_field
from utils.types import (
    FlightPriceOpts,
    RoundTripRouteDetails,
    TaskSpec,
    TaskHandlers,
)

POLL_INTERVAL = 10000

"""
Flight Watcher Task
"""
flight_price_watcher = restate.Workflow("FlightPriceWatcher")


@flight_price_watcher.main()
async def run(ctx: restate.WorkflowContext, opts: FlightPriceOpts):
    logging.info("Running flight price watcher for: %s and with ID %s", opts, ctx.key())
    cancelled = ctx.promise("cancelled")
    attempt = 0

    while True:
        attempt += 1
        best_offer_so_far = await ctx.run(
            "Probing prices #" + str(attempt),
            lambda: get_best_quote(opts.trip, opts.price_threshold_usd),
        )

        if best_offer_so_far["price"] <= opts.price_threshold_usd:
            return f"Found an offer matching the price for {opts.name} {str(best_offer_so_far)}"

        ctx.set("last_quote", best_offer_so_far)
        await ctx.sleep(timedelta(milliseconds=POLL_INTERVAL))



@flight_price_watcher.handler("getCurrentStatus")
async def get_current_status(ctx: restate.WorkflowSharedContext) -> float | None:
    return await ctx.get("last_quote")


def params_parser(name: str, params: Any) -> FlightPriceOpts:
    description = params.get("description")
    print(description)
    if not isinstance(description, str):
        description = None

    price_threshold_usd = parse_currency(check_field(params, "price_threshold"))

    trip = RoundTripRouteDetails(
        start=check_field(params, "start_airport"),
        destination=check_field(params, "destination_airport"),
        outbound_date=check_field(params, "outbound_date"),
        return_date=check_field(params, "return_date"),
        travel_class=check_field(params, "travel_class"),
    )

    return FlightPriceOpts(
        name=name,
        description=description,
        trip=trip,
        price_threshold_usd=price_threshold_usd,
    )


flight_task = TaskSpec(
    task_service_name="FlightPriceWatcher",
    task_type_name="flight_price",
    task_handlers=TaskHandlers(
        run=run, get_current_status=get_current_status
    ),
    params_parser=params_parser,
)
