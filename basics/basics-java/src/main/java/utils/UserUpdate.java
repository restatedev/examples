package utils;

public class UserUpdate {
    private String profile;
    private String permissions;
    private String resources;

    public UserUpdate(String profile, String permissions, String resource) {
        this.profile = profile;
        this.permissions = permissions;
        this.resources = resource;
    }

    public String getProfile() {
        return profile;
    }

    public void setProfile(String profile) {
        this.profile = profile;
    }

    public String getPermissions() {
        return permissions;
    }

    public void setPermissions(String permissions) {
        this.permissions = permissions;
    }

    public String getResources() {
        return resources;
    }

    public void setResources(String resources) {
        this.resources = resources;
    }
}
