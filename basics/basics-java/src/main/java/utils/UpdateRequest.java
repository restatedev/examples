package durable_execution.utils;

import utils.Permission;
import utils.UserRole;

import java.util.List;

public class UpdateRequest {
    private String userId;
    private UserRole role;
    private List<Permission> permissions;

    public UpdateRequest(String userId, UserRole role, List<Permission> permissions) {
        this.userId = userId;
        this.role = role;
        this.permissions = permissions;
    }

    // Getters and setters
    public String getUserId() {
        return userId;
    }

    public void setUserId(String userId) {
        this.userId = userId;
    }

    public UserRole getRole() {
        return role;
    }

    public void setRole(UserRole role) {
        this.role = role;
    }

    public List<Permission> getPermissions() {
        return permissions;
    }

    public void setPermissions(List<Permission> permissions) {
        this.permissions = permissions;
    }
}
