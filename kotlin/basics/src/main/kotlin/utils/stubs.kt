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
package utils

import dev.restate.sdk.common.TerminalException
import org.apache.logging.log4j.LogManager

private val logger = LogManager.getLogger("stubs")

fun applyUserRole(userId: String, role: UserRole?): Boolean {
  maybeCrash(0.3)
  logger.info(">>> Applying role $role to user $userId")
  return true
}

fun applyPermission(userId: String, permission: Permission) {
  maybeCrash(0.2)
  logger.info(">>> Applying permission ${permission.permissionKey}:${permission.setting} for user $userId")
}

fun getCurrentRole(userId: String): UserRole {
  return UserRole("viewer", "User cannot do much")
}

fun tryApplyUserRole(userId: String, role: UserRole) {
  maybeCrash(0.3)

  if (role.roleKey != "viewer") {
    applicationError(0.3, "Role ${role.roleKey} is not possible for user $userId")
  }
  logger.error(">>> Applying role $role to user $userId")
}

fun tryApplyPermission(userId: String, permission: Permission): Permission {
  maybeCrash(0.3)

  if (permission.setting != "blocked") {
    applicationError(
      0.4,
      "Could not apply permission ${permission.permissionKey}:${permission.setting} for user$userId due to a conflict."
    )
  }
  logger.info(">>> Applying permission ${permission.permissionKey}:${permission.setting} for user $userId")

  return Permission(permission.permissionKey, "blocked")
}

fun updateUserProfile(profile: String): String {
  return if (Math.random() < 0.8) "NOT_READY" else "$profile-id"
}

fun setUserPermissions(userId: String, permissions: String): String {
  return permissions
}

fun provisionResources(userId: String, role: String, resources: String) {}

fun createUserEntry(user: User) {
}

fun sendEmailWithLink(email: String, secret: String) {
}

private val killProcess: Boolean = System.getenv("CRASH_PROCESS") != null

fun maybeCrash(probability: Double) {
  if (Math.random() < probability) {
    logger.error("A failure happened!")

    if (killProcess) {
      logger.error("--- CRASHING THE PROCESS ---")
      System.exit(1)
    } else {
      throw RuntimeException("A failure happened!")
    }
  }
}

fun applicationError(probability: Double, message: String) {
  if (Math.random() < probability) {
    logger.error("Action failed: $message")
    throw TerminalException(message)
  }
}