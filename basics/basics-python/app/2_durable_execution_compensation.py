#
#  Copyright (c) 2023-2024 - Restate Software, Inc., Restate GmbH
#
#  This file is part of the Restate examples,
#  which is released under the MIT license.
#
#  You can find a copy of the license in file LICENSE in the root
#  directory of this repository or package, or at
#  https:#github.com/restatedev/sdk-typescript/blob/main/LICENSE
from typing import TypedDict

import restate
from restate import Service, Context
from restate.exceptions import TerminalError

from utils import try_apply_user_role, UpdateRequest, get_current_role, try_apply_permission, Permission

role_update = Service("roleUpdate")


# Durable execution ensures code runs to the end, even in the presence of
# failures. That allows developers to implement error handling with common
# control flow in code.
#
#  - This example uses the SAGA pattern: on error, the code undos previous
#    operations in reverse order
#  - The code uses common exception handling and variables/arrays to remember
#    the previous values to restore
#
@role_update.handler(name="applyRoleUpdate")
async def apply_role_update(ctx: Context, update: UpdateRequest):
    # parameters are durable across retries
    user_id, role, permissions = update["user_id"], update["role"], update["permissions"]

    # Restate does retries for regular failures.
    # TerminalErrors, on the other hand, are not retried and are propagated
    # back to the caller.
    # No permissions were applied so far, so if this fails,
    # we propagate the error directly back to the caller.
    previous_role = await ctx.run("current_role", lambda: get_current_role(user_id))
    await ctx.run("", lambda: try_apply_user_role(user_id, role))

    # Apply all permissions in order.
    # We collect the previous permission settings to reset if the process fails.
    previous_permissions = []
    for permission in permissions:
        try:
            previous = await ctx.run("apply_permission", lambda: try_apply_permission(user_id, permission))
            previous_permissions.append(previous)
        except TerminalError as e:
            await rollback(ctx, user_id, previous_role, previous_permissions)
            raise e


app = restate.app(services=[role_update])


async def rollback(ctx: restate.Context, user_id: str, previous_role: str, permissions: list[Permission]):
    print(">>> !!! ROLLING BACK CHANGES !!! <<<")
    for prev in reversed(permissions):
        await ctx.run(f"reapply previous permission {prev}", lambda: try_apply_permission(user_id, prev))

    await ctx.run("reapply previous role", lambda: try_apply_user_role(user_id, previous_role))

#
# See README for details on how to start and connect Restate.
#
# When invoking this function (see below for sample request), you will see that
# all role/permission changes are attempted. Upon an unrecoverable error (like a
# semantic application error), previous operations are reversed.
#
# You will see all lines of the type "Applied permission remove:allow for user Sam Beckett",
# and, in case of a terminal error, their reversal.
#
# This will proceed reliably across the occasional process crash, that we blend in.
# Once an action has completed, it does not get re-executed on retries, so each line occurs only once.
#
# curl localhost:8080/roleUpdate/applyRoleUpdate -H 'content-type: application/json' -d \
# '{
#     "userId": "Sam Beckett",
#     "role": { "roleKey": "content-manager", "roleDescription": "Add/remove documents" },
#     "permissions" : [
#       { "permissionKey": "add", "setting": "allow" },
#       { "permissionKey": "remove", "setting": "allow" },
#       { "permissionKey": "share", "setting": "block" }
#     ]
# }'
