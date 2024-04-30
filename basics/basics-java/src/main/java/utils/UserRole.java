package utils;

public class UserRole {
    private String roleKey;
    private String roleDescription;

    public UserRole(String roleKey, String roleDescription) {
        this.roleKey = roleKey;
        this.roleDescription = roleDescription;
    }

    // Getters and setters
    public String getRoleKey() {
        return roleKey;
    }

    public void setRoleKey(String roleKey) {
        this.roleKey = roleKey;
    }

    public String getRoleDescription() {
        return roleDescription;
    }

    public void setRoleDescription(String roleDescription) {
        this.roleDescription = roleDescription;
    }
}
