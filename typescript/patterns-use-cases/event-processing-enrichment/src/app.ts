/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */
import * as restate from "@restatedev/restate-sdk";
import { ObjectContext, TerminalError } from "@restatedev/restate-sdk";

// Package tracking system:
// Digital twin representing a package in delivery with real-time location updates.
// Handlers get called over HTTP or Kafka.
const packageTracker = restate.object({
    name: "package-tracker",
    handlers: {
        // Called first by the seller over HTTP
        registerPackage: async (ctx: ObjectContext, event: PackageInfo) => {
            // Store the package details in the state
            ctx.set("details", event);
        },

        // Connected to a Kafka topic for real-time location updates
        updateLocation: async (ctx: ObjectContext, locationUpdate: LocationUpdate) => {
            const packageInfo = await ctx.get<PackageInfo>("package");
            if (!packageInfo) {
                throw new TerminalError("Package not found");
            }

            // Update the package details in the state
            packageInfo.locations.push(locationUpdate);
            ctx.set("details", packageInfo);
        },

        // Called by the delivery dashboard to get the package details
        getPackageInfo: async (ctx: ObjectContext) =>
            ({ id: ctx.key, ...await ctx.get<PackageInfo>("details")})
    },
});

restate.endpoint().bind(packageTracker).listen();

// Example API Usage:
/*
curl localhost:8080/package-tracker/package123/register --json '{ "id": "package123", "locations": [] }'
curl localhost:8080/package-tracker/package123/updateLocation --json '{ "timestamp": "2024-12-11T12:00:00Z", "location": "Warehouse A" }'
curl localhost:8080/package-tracker/package123/getPackageInfo
*/

type PackageInfo = {
    id: string;
    finalDestination: string;
    locations: LocationUpdate[];
};

type LocationUpdate = {
    timestamp: string;
    location: string;
};