package my.example.eventenrichment.types;

import java.util.ArrayList;
import java.util.List;

public class PackageInfo {
    private String finalDestination;
    private List<LocationUpdate> locations = new ArrayList<>();

    public PackageInfo(String finalDestination) {
        this.finalDestination = finalDestination;
    }

    public String getFinalDestination() {
        return finalDestination;
    }

    public void setFinalDestination(String finalDestination) {
        this.finalDestination = finalDestination;
    }

    public List<LocationUpdate> getLocations() {
        return locations;
    }

    public void setLocations(List<LocationUpdate> locations) {
        this.locations = locations;
    }

    public void addLocation(LocationUpdate locationUpdate) {
        this.locations.add(locationUpdate);
    }
}