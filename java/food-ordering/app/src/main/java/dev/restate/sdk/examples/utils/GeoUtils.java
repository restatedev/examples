package dev.restate.sdk.examples.utils;

import dev.restate.sdk.examples.types.Location;


public class GeoUtils {
    public static final String DEMO_REGION = "San Jose (CA)";

    private static final double LONG_MIN = -0.0675;
    private static final double LONG_MAX = 0.0675;
    private static final double LAT_MIN = -0.0675;
    private static final double LAT_MAX = 0.0675;
    private static final double SPEED = 0.005;

    public static double randomInInterval(double min, double max){
        double range = max-min;
        return Math.random() * range + min;
    }

    public static Location randomLocation() {
        return new Location(randomInInterval(LONG_MIN, LONG_MAX), randomInInterval(LAT_MIN, LAT_MAX));
    }

    public static Location moveToDestination(Location location, Location destination){
        double dx = destination.lon - location.lon;
        double dy = destination.lat - location.lat;
        double distance = Math.sqrt(dx*dx + dy*dy);
        if (distance < SPEED){
            return destination;
        }
        double ratio = SPEED / distance;
        return new Location(location.lon + dx * ratio, location.lat + dy * ratio);
    }

    public static Long calculateEtaMillis(Location currentLocation, Location targetLocation) {
        var longDiff = Math.abs(targetLocation.lon - currentLocation.lon);
        var latDiff = Math.abs(targetLocation.lat - currentLocation.lat);
        var distance = Math.max(longDiff, latDiff);
        return Math.round(1000 * distance / SPEED);
    }
}
