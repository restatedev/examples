import restate
import logging
from datetime import timedelta
from typing import Any

from tasks.flights.utils.api import get_best_quote
from utils.types import (
    FlightPriceOpts,
    TaskSpec,
    TaskHandlers,
)

POLL_INTERVAL = 10000

flight_price_watcher = restate.Workflow("FlightPriceWatcher")


@flight_price_watcher.main()
async def run(ctx: restate.WorkflowContext, opts: FlightPriceOpts):
    logging.info("Running flight price watcher for: %s and with ID %s", opts, ctx.key())
    attempt = 0

    while True:
        attempt += 1
        best_offer_so_far = await ctx.run_typed(
            "Probing prices #" + str(attempt),
            get_best_quote,
            trip=opts,
            price_threshold=opts.price_threshold_usd,
        )

        if best_offer_so_far["price"] <= opts.price_threshold_usd:
            return f"Found an offer matching the price for {ctx.key()} {str(best_offer_so_far)}"

        ctx.set("last_quote", best_offer_so_far)
        await ctx.sleep(timedelta(milliseconds=POLL_INTERVAL))


@flight_price_watcher.handler("getCurrentStatus")
async def get_current_status(ctx: restate.WorkflowSharedContext) -> float | None:
    return await ctx.get("last_quote")


def params_parser(params: Any) -> FlightPriceOpts:
    return FlightPriceOpts(**params)


flight_task = TaskSpec(
    task_service_name="FlightPriceWatcher",
    task_type_name="flight_price",
    task_handlers=TaskHandlers(run=run, get_current_status=get_current_status),
    params_parser=params_parser,
)
