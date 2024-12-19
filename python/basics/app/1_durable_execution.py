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

from restate import Service, Context
import restate

from utils import apply_user_role, apply_permission, UpdateRequest

role_update = Service("roleUpdate")


# This is an example of the benefits of Durable Execution.
# Durable Execution ensures code runs to the end, even in the presence of
# failures. This is particularly useful for code that updates different systems and needs to
# make sure all updates are applied:
#
#  - Failures are automatically retried, unless they are explicitly labeled
#    as terminal errors
#  - Restate tracks execution progress in a journal.
#    Work that has already been completed is not repeated during retries.
#    Instead, the previously completed journal entries are replayed.
#    This ensures that stable deterministic values are used during execution.
#  - Durable executed functions use the regular code and control flow,
#    no custom DSLs
#

@role_update.handler(name="applyRoleUpdate")
async def apply_role_update(ctx: Context, update: UpdateRequest):
    # parameters are durable across retries
    user_id, role, permissions = update["user_id"], update["role"], update["permissions"]

    # Apply a change to one system (e.g., DB upsert, API call, ...).
    # The side effect persists the result with a consensus method so
    # any later code relies on a deterministic result.
    success = await ctx.run("apply_user_role", lambda: apply_user_role(user_id, role))
    if not success:
        return

    # Loop over the permission settings and apply them.
    # Each operation through the Restate context is journaled
    # and recovery restores results of previous operations from the journal
    # without re-executing them.
    for permission in permissions:
        await ctx.run("apply_permission", lambda: apply_permission(user_id, permission))


app = restate.app(services=[role_update])

#
# See README for details on how to start and connect Restate.
#
# When invoking this function (see below for sample request), it will apply all
# role and permission changes, regardless of crashes.
# You will see all lines of the type "Applied permission remove:allow for user Sam Beckett"
# in the log, across all retries. You will also see that re-tries will not re-execute
# previously completed actions again, so each line occurs only once.
#
# curl localhost:8080/roleUpdate/applyRoleUpdate -H 'content-type: application/json' -d \
# '{
#     "user_id": "Sam Beckett",
#     "role": "content-manager",
#     "permissions" : [
#       { "permissionKey": "add", "setting": "allow" },
#       { "permissionKey": "remove", "setting": "allow" },
#       { "permissionKey": "share", "setting": "block" }
#     ]
# }'
