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

const long_min = -0.0675;
const long_max = 0.0675;
const lat_min = -0.0675;
const lat_max = 0.0675;
const speed = 0.005;

function randomInInterval(min: number, max: number): number {
    const range = max - min;
    return Math.random() * range + min;
}


export function randomLocation(): Location {
    return {
        long: randomInInterval(long_min, long_max),
        lat:  randomInInterval(lat_min, lat_max)
    }
}

export function step(): number {
 return speed;
}

export function calculateEtaMillis(currentLocation: Location, targetLocation: Location): number {
    const longDiff = Math.abs(targetLocation.long - currentLocation.long);
    const latDiff = Math.abs(targetLocation.lat - currentLocation.lat);
    const distance = Math.max(longDiff, latDiff);
    return 1000 * distance / speed;
}