import logging
import random
from datetime import timedelta

import restate

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] [%(process)d] [%(levelname)s] - %(message)s')


class Status:
    UP = "UP"
    DOWN = "DOWN"


async def bring_up_machine(ctx: restate.Context, machine_id: str):
    logging.info(f"Beginning transition of {machine_id} to up")
    maybe_crash(0.4)
    await ctx.sleep(timedelta(seconds=5))
    logging.info(f"Done transitioning {machine_id} to up")


async def tear_down_machine(ctx: restate.Context, machine_id: str):
    logging.info(f"Beginning transition of {machine_id} to down")
    maybe_crash(0.4)
    await ctx.sleep(timedelta(seconds=5))
    logging.info(f"Done transitioning {machine_id} to down")


def maybe_crash(probability: float = 0.5) -> None:
    if random.random() < probability:
        logging.error("A failure happened!")
        raise Exception("A failure happened!")
