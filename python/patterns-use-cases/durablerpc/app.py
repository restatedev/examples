import restate
import logging

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] [%(process)d] [%(levelname)s] - %(message)s')
logger = logging.getLogger(__name__)

product_service = restate.VirtualObject("product")


@product_service.handler()
async def reserve(ctx: restate.ObjectContext) -> bool:
    if await ctx.get("reserved", type_hint=bool):
        logging.info(f"Product already reserved {ctx.key()}")
        return False
    logging.info(f"Reserving product {ctx.key()}")
    ctx.set("reserved", True)
    return True

app = restate.app([product_service])


if __name__ == "__main__":
    import hypercorn
    import asyncio
    conf = hypercorn.Config()
    conf.bind = ["0.0.0.0:9080"]
    asyncio.run(hypercorn.asyncio.serve(app, conf))