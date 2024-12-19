import argparse
import requests
from async_task_worker import TaskOpts

RESTATE_URL = "http://localhost:8080"


def submit_and_await_task(task: TaskOpts):
    idempotency_key = task.id
    print(f"Submitting task with idempotency key: {idempotency_key}")
    headers = {
        # use a stable uuid as an idempotency key
        "idempotency-key": idempotency_key,
        "Content-Type": "application/json"
    }

    # Submit the task; similar to publishing a message to a queue
    # Restate ensures the task is executed exactly once
    # Optionally set a delay for the task by adding `?delay=10s` to the URL
    url = f"{RESTATE_URL}/AsyncTaskWorker/run/send"
    send_request = requests.post(url, json=task.model_dump(), headers=headers)
    print(f"Task submitted: {send_request.json()}")

    # ... Do something else, with task running in the background ...

    # Attach back to the task to retrieve the result
    attach_url = f"{RESTATE_URL}/restate/invocation/AsyncTaskWorker/run/{idempotency_key}/attach"
    response = requests.get(attach_url)
    print(f"Task result: {response.json()}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("id", type=str, help="Task ID")

    args = parser.parse_args()
    submit_and_await_task(TaskOpts(id=args.id))


