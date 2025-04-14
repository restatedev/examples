import restate
from pydantic import BaseModel
from restate.exceptions import TerminalError


class LocationUpdate(BaseModel):
    location: str
    timestamp: str


class PackageInfo(BaseModel):
    final_destination: str
    locations: list[LocationUpdate] = []


# Package tracking system:
# Digital twin representing a package in delivery with real-time location updates.
# Handlers get called over HTTP or Kafka.
package_tracker = restate.VirtualObject("package-tracker")


# Called first by the seller over HTTP
@package_tracker.handler("registerPackage")
async def register_package(ctx: restate.ObjectContext, package_info: PackageInfo):
    # store in state the user's information as coming from the registration event
    ctx.set("package-info", package_info)


# Connected to a Kafka topic for real-time location updates
@package_tracker.handler("updateLocation")
async def update_location(ctx: restate.ObjectContext, location_update: LocationUpdate):
    # get the package info from the state
    package_info = await ctx.get("package-info", type_hint=PackageInfo)
    if package_info is None:
        raise TerminalError(f"Package {ctx.key()} not found")

    # Update the package details in the state
    package_info.locations.append(location_update)
    ctx.set("package-info", package_info)


# Called by the delivery dashboard to get the package details
@package_tracker.handler("getPackageInfo", kind="shared")
async def get_package_info(ctx: restate.ObjectSharedContext) -> PackageInfo:
    return await ctx.get("package-info", type_hint=PackageInfo)


app = restate.app(services=[package_tracker])


if __name__ == "__main__":
    import hypercorn
    import asyncio
    conf = hypercorn.Config()
    conf.bind = ["0.0.0.0:9080"]
    asyncio.run(hypercorn.asyncio.serve(app, conf))