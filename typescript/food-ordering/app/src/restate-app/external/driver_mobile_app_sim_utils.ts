// --------------------------------------------------------
//  helpers
// --------------------------------------------------------

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