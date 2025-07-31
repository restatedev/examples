import * as restate from "@restatedev/restate-sdk";
import {
  handlers,
  ObjectContext,
  ObjectSharedContext,
  TerminalError,
} from "@restatedev/restate-sdk";
import shared = handlers.object.shared;

// Package tracking system:
// Digital twin representing a package in delivery with real-time location updates.
// Handlers get called over HTTP or Kafka.
const packageTracker = restate.object({
  name: "package-tracker",
  handlers: {
    // Called first by the seller over HTTP
    registerPackage: async (ctx: ObjectContext, packageInfo: PackageInfo) => {
      // Store the package details in the state
      ctx.set("package-info", packageInfo);
    },

    // Connected to a Kafka topic for real-time location updates
    updateLocation: async (ctx: ObjectContext, locationUpdate: LocationUpdate) => {
      const packageInfo = await ctx.get<PackageInfo>("package-info");
      if (!packageInfo) {
        throw new TerminalError(`Package ${ctx.key} not found`);
      }

      // Update the package details in the state
      (packageInfo.locations ??= []).push(locationUpdate);
      ctx.set("package-info", packageInfo);
    },

    // Called by the delivery dashboard to get the package details
    getPackageInfo: shared((ctx: ObjectSharedContext) => ctx.get<PackageInfo>("package-info")),
  },
});

restate.serve({
  services: [packageTracker],
});
// Process package tracking events via HTTP:
/*
curl localhost:8080/package-tracker/package1234/registerPackage -H 'content-type: application/json' -d '{ "finalDestination": "Bridge 6, Amsterdam", "locations": [] }'
curl localhost:8080/package-tracker/package1234/updateLocation -H 'content-type: application/json' -d '{ "timestamp": "2024-12-11T12:00:00Z", "location": "Warehouse A" }'
curl localhost:8080/package-tracker/package1234/getPackageInfo
*/

type PackageInfo = {
  finalDestination: string;
  locations?: LocationUpdate[];
};

type LocationUpdate = {
  timestamp: string;
  location: string;
};
