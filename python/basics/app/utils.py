import os
import random
from typing import TypedDict

from restate import Context
from restate.exceptions import TerminalError


class Permission(TypedDict):
    permissionKey: str
    setting: str


class UpdateRequest(TypedDict):
    role: str
    user_id: str
    permissions: list[Permission]


def apply_user_role(user_id, role) -> bool:
    maybe_crash(0.3)
    print(f"Applied {role} to user {user_id}")
    return True


def apply_permission(user_id, permission):
    maybe_crash(0.2)
    print(f"Applied permission {permission} to user {user_id}")


def try_apply_user_role(user_id, role):
    maybe_crash(0.3)

    if role != "viewer":
        application_error(0.3, f"Role {role} is not possible for user {user_id}")
    print(f"Applied {role} to user {user_id}")


def get_current_role(user_id):
    # in this example, the previous role was always just 'viewer'
    return "viewer"


def try_apply_permission(user_id, permission):
    maybe_crash(0.3)

    if permission["setting"] != "blocked":
        application_error(0.4, f"Could not apply {permission} for user {user_id} due to a conflict")
    print(f"Applied permission {permission['permissionKey']} to user {user_id}")
    return Permission(permissionKey=permission["permissionKey"], setting="blocked")


kill_process = bool(os.getenv("CRASH_PROCESS"))


def maybe_crash(probability: float = 0.5) -> None:
    if random.random() < probability:
        print("A failure happened!")
        if kill_process:
            print("--- CRASHING THE PROCESS ---")
            os.exit(1)
        else:
            raise Exception("A failure happened!")


def application_error(probability: float, message: str) -> None:
    if random.random() < probability:
        print(f"Action failed: {message}")
        raise TerminalError(message)


# =======================================================
# Stubs for 3_workflows.py

def create_user_entry(signup):
    pass


def send_email_with_link(param, secret):
    pass


# =======================================================
# Stubs for 5_events_processing.py

def setup_user_permissions(user_id, permissions):
    pass


def provision_resources(user_id, role_id, resources):
    pass


def update_user_profile(profile):
    pass
