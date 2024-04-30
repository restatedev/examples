package utils;

public class Permission {
    private String permissionKey;
    private String setting;

    public Permission(String permissionKey, String setting) {
        this.permissionKey = permissionKey;
        this.setting = setting;
    }

    // Getters and setters
    public String getPermissionKey() {
        return permissionKey;
    }

    public void setPermissionKey(String permissionKey) {
        this.permissionKey = permissionKey;
    }

    public String getSetting() {
        return setting;
    }

    public void setSetting(String setting) {
        this.setting = setting;
    }
}
