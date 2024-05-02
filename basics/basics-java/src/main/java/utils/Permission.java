/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */
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
