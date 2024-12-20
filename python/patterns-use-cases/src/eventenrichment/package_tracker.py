from typing import List

import restate
from pydantic import BaseModel
from restate import VirtualObject, ObjectContext
from restate.exceptions import TerminalError


class LocationUpdate(BaseModel):
    location: str
    timestamp: str


class PackageInfo(BaseModel):
    final_destination: str
    locations: List[LocationUpdate] = []


# Package tracking system:
# Digital twin representing a package in delivery with real-time location updates.
# Handlers get called over HTTP or Kafka.
package_tracker = VirtualObject("package-tracker")


# Called first by the seller over HTTP
@package_tracker.handler("registerPackage")
async def register_package(ctx: ObjectContext, package_info: PackageInfo):
    # store in state the user's information as coming from the registration event
    ctx.set("package-info", package_info.model_dump())


# Connected to a Kafka topic for real-time location updates
@package_tracker.handler("updateLocation")
async def update_location(ctx: ObjectContext, location_update: LocationUpdate):
    # get the package info from the state
    package_info = PackageInfo(**await ctx.get("package-info"))
    if package_info is None:
        raise TerminalError(f"Package {ctx.key()} not found")

    # Update the package details in the state
    locations = package_info.locations or []
    locations.append(location_update)
    package_info.locations = locations

    # store the updated package info in state
    ctx.set("package-info", package_info.model_dump())


# Called by the delivery dashboard to get the package details
@package_tracker.handler("getPackageInfo")
async def get_package_info(ctx: ObjectContext) -> PackageInfo:
    return PackageInfo(**await ctx.get("package-info"))


app = restate.app(services=[package_tracker])