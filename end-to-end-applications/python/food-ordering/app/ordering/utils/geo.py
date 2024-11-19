# Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
#
# This file is part of the Restate examples,
# which is released under the MIT license.
#
# You can find a copy of the license in the file LICENSE
# in the root directory of this repository or package or at
# https://github.com/restatedev/examples/

from typing import TypedDict
import random


class Location(TypedDict):
    long: float
    lat: float


long_min = -0.0675
long_max = 0.0675
lat_min = -0.0675
lat_max = 0.0675
speed = 0.005


def random_in_interval(min: float, max: float) -> float:
    range = max - min
    return random.random() * range + min


def random_location() -> Location:
    return {
        "long": random_in_interval(long_min, long_max),
        "lat": random_in_interval(lat_min, lat_max)
    }


def step() -> float:
    return speed


def calculate_eta_millis(current_location: Location, target_location: Location) -> float:
    long_diff = abs(target_location["long"] - current_location["long"])
    lat_diff = abs(target_location["lat"] - current_location["lat"])
    distance = max(long_diff, lat_diff)
    return 1000 * distance / speed
