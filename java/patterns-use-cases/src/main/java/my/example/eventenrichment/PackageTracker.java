package my.example.eventenrichment;

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.SharedObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Shared;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.common.StateKey;
import my.example.eventenrichment.types.LocationUpdate;
import my.example.eventenrichment.types.PackageInfo;

// Package tracking system:
// Digital twin representing a package in delivery with real-time location updates.
// Handlers get called over HTTP or Kafka.
@VirtualObject
public class PackageTracker {

    private static final StateKey<PackageInfo> PACKAGE_INFO =
            StateKey.of("package-info", PackageInfo.class);

    // Called first by the seller over HTTP
    @Handler
    public void registerPackage(ObjectContext ctx, PackageInfo packageInfo) {
        // Store the package details in the state
        ctx.set(PACKAGE_INFO, packageInfo);
    }

    // Connected to a Kafka topic for real-time location updates
    @Handler
    public void updateLocation(ObjectContext ctx, LocationUpdate locationUpdate) {
        var packageInfo = ctx.get(PACKAGE_INFO)
                .orElseThrow(() -> new TerminalException("Package not found"));

        // Update the package info with the new location
        packageInfo.addLocation(locationUpdate);
        ctx.set(PACKAGE_INFO, packageInfo);
    }

    // Called by the delivery dashboard to get the package details
    @Shared
    public PackageInfo getPackageInfo(SharedObjectContext ctx) {
        return ctx.get(PACKAGE_INFO)
                .orElseThrow(() -> new TerminalException("Package not found"));
    }

    public static void main(String[] args) {
        RestateHttpServer.listen(Endpoint.bind(new PackageTracker()));
    }
}

// Example API Usage:
/*
curl localhost:8080/PackageTracker/package123/registerPackage -H 'content-type: application/json' -d '{ "finalDestination": "Bridge 6, Amsterdam"}'
curl localhost:8080/PackageTracker/package123/updateLocation -H 'content-type: application/json' -d '{ "timestamp": "2024-12-11T12:00:00Z", "location": "Warehouse A" }'
curl localhost:8080/PackageTracker/package123/getPackageInfo
*/