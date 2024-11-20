import random

# You can remove this file.
# It's only purpose is providing stubs for the template.


def send_notification(greeting_id: str, name: str):
    if random.random() < 0.5:  # 50% chance of failure
        print(f"Failed to send notification: {greeting_id} - {name}")
        raise Exception(f"Failed to send notification: {greeting_id} - {name}")
    print(f"Notification sent: {greeting_id} - {name}")


def send_reminder(greeting_id: str):
    if random.random() < 0.5:  # 50% chance of failure
        print(f"Failed to send reminder: {greeting_id}")
        raise Exception(f"Failed to send reminder: {greeting_id}")
    print(f"Reminder sent: {greeting_id}")
