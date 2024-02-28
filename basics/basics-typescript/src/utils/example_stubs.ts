/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

import { applicationError, maybeCrash } from "./failures"

export type UserRole = {
  roleKey: string,
  roleDescription: string
}
  
export type Permission = {
  permissionKey: string,
  setting: string
}
  
export type UpdateRequest = {
  userId: string,
  role: UserRole,
  permissons: Permission[]
}

export async function getCurrentRole(userId: string): Promise<UserRole> {
  // in this example, the previous role was always just 'viewer'
  return { roleKey: "viewer", roleDescription: "User that cannot do much" }
}

/*
  * This function would call the service or API to record the new user role.
  * For the sake of this example, we just fail with a random probability and
  * otherwise return success.
  */
export async function applyUserRole(userId: string, userRole: UserRole): Promise<boolean> {
  maybeCrash(0.3);
  console.log(`>>> Applied role ${userRole.roleKey} for user ${userId}`);
  return true;
}

/*
  * This function would call the service or API to apply a permission.
  * For the sake of this example, we just fail with a random probability
  * and otherwise return success.
  */
export async function applyPermission(userId: string, permission: Permission): Promise<void> {
  maybeCrash(0.2);
  console.log(`>>> Applied permission ${permission.permissionKey}:${permission.setting} for user ${userId}`);
}

/*
 * This function would typically call the service or API to record the new user role.
 * For the sake of this example, we sometimes fail when applying an advanced role
 * and otherwise return success.
 */
export async function tryApplyUserRole(userId: string, userRole: UserRole): Promise<void> {
  maybeCrash(0.3); // sometimes infra goes away

  if (userRole.roleKey !== "viewer") {
    applicationError(0.3, `Role ${userRole.roleKey} is not possible for user ${userId}`);
  }
  console.log(`>>> Applied role ${userRole.roleKey} for user ${userId}`);
}

/*
 * This function would call the service or API to apply a permission.
 * For the sake of this example, we sometimes fail when applying an 'allow' permission
 * and otherwise return success. Also, we sometimes crash the process.
 */
export async function tryApplyPermission(userId: string, permission: Permission): Promise<Permission> {
  const { permissionKey, setting } = permission;
  maybeCrash(0.3); // sometimes infra goes away

  if (setting !== "blocked") {
    applicationError(0.4, `Could not apply permission ${permissionKey}:${setting} for user ${userId} due to a conflict.`);
  }
  console.log(`>>> Applied permission ${permissionKey}:${setting} for user ${userId}`);
  return { permissionKey, setting: "blocked" }
}