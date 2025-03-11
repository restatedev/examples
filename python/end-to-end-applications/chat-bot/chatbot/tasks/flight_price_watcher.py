"""
Flight Watcher Task
"""

import logging
from datetime import timedelta
from typing import Any

from restate import Workflow, WorkflowContext, WorkflowSharedContext

from chatbot.taskmanager import TaskSpec
from chatbot.tasks.task_workflow import TaskWorkflow
from chatbot.utils.flight_price_api import get_best_quote
from chatbot.utils.types import FlightPriceOpts, RoundTripRouteDetails
from chatbot.utils.utils import parse_currency, check_field

POLL_INTERVAL = 10000

flight_price_watcher = Workflow("FlightPriceWatcher")


@flight_price_watcher.main()
async def run(ctx: WorkflowContext, opts: FlightPriceOpts):
    logging.info("Running flight price watcher for: %s and with ID %s", opts, ctx.key())
    cancelled = ctx.promise("cancelled")
    attempt = 0

    while not await cancelled.peek():
        best_offer_so_far = await ctx.run("Probing prices #" + str(attempt + 1),
                                          lambda: get_best_quote(opts["trip"], opts["price_threshold_usd"]))

        if best_offer_so_far["price"] <= opts["price_threshold_usd"]:
            return "Found an offer matching the price for" + opts["name"] + " " + str(best_offer_so_far)

        ctx.set("last_quote", best_offer_so_far)

        await ctx.sleep(timedelta(milliseconds=POLL_INTERVAL))

    return "(cancelled)"


@flight_price_watcher.handler()
async def cancel(ctx: WorkflowSharedContext):
    await ctx.promise("cancelled").resolve(True)


@flight_price_watcher.handler("getCurrentStatus")
async def get_current_status(ctx: WorkflowSharedContext) -> float | None:
    return await ctx.get("last_quote")


def params_parser(name: str, params: Any) -> FlightPriceOpts:
    description = params.get("description")
    if not isinstance(description, str):
        description = None

    price_threshold_usd = parse_currency(check_field(params, "price_threshold"))

    trip = RoundTripRouteDetails(
        start=check_field(params, "start_airport"),
        destination=check_field(params, "destination_airport"),
        outbound_date=check_field(params, "outbound_date"),
        return_date=check_field(params, "return_date"),
        travel_class=check_field(params, "travel_class")
    )

    return FlightPriceOpts(
        name=name,
        description=description,
        trip=trip,
        price_threshold_usd=price_threshold_usd
    )


flightTask = TaskSpec(
    params_parser=params_parser,
    task_type_name="flight_price",
    task_workflow=TaskWorkflow(run, cancel, get_current_status)
)
