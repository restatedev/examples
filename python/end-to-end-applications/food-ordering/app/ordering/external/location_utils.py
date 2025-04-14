from typing import Tuple, Any

from ordering.types.types import Location
import ordering.utils.geo as geo


def update_location(current: Location, target: Location) -> tuple[Location, bool]:
    new_long = dim_step(current["long"], target["long"])
    new_lat = dim_step(current["lat"], target["lat"])

    arrived = new_long == target["long"] and new_lat == target["lat"]
    return Location(long=new_long, lat=new_lat), arrived


def dim_step(current: float, target: float) -> float:
    step = geo.step()
    return (
        target
        if abs(target - current) < step
        else (current + step if target > current else current - step)
    )
