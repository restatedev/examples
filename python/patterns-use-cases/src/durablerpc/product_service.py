import restate
from restate import ObjectContext, VirtualObject

product_service = VirtualObject("product")


@product_service.handler()
async def reserve(ctx: ObjectContext) -> bool:
    if await ctx.get("reserved"):
        print(f"Product already reserved {ctx.key}")
        return False
    print(f"Reserving product {ctx.key()}")
    ctx.set("reserved", True)
    return True

app = restate.app([product_service])