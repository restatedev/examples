/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate examples,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */
import { Location } from "../types/types";
import * as geo from "../utils/geo";

export function updateLocation(current: Location, target: Location): { newLocation: Location, arrived: boolean} {
    const newLong = dimStep(current.long, target.long);
    const newLat = dimStep(current.lat, target.lat);

    const arrived = newLong === target.long && newLat === target.lat;
    return { arrived: arrived, newLocation: { long: newLong, lat: newLat } }
}

function dimStep(current: number, target: number): number {
    const step = geo.step();
    return Math.abs(target - current) < step
        ? target
        : target > current
            ? current + step
            : current - step;
}