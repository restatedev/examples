import random

# You can remove this file.
# It's only purpose is providing stubs for the template.


def send_notification(greeting_id: str, name: str):
    if random.random() < 0.7 and name == "Alice":  # 70% chance of failure
        print(f"[👻 SIMULATED] Failed to send notification: {greeting_id} - {name}")
        raise Exception(
            f"[👻 SIMULATED] Failed to send notification: {greeting_id} - {name}"
        )
    print(f"Notification sent: {greeting_id} - {name}")


def send_reminder(greeting_id: str, name: str):
    if random.random() < 0.7 and name == "Alice":  # 70% chance of failure
        print(f"[👻 SIMULATED] Failed to send reminder: {greeting_id}")
        raise Exception(f"[👻 SIMULATED] Failed to send reminder: {greeting_id}")
    print(f"Reminder sent: {greeting_id}")
