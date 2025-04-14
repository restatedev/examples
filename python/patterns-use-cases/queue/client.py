import argparse
import logging
import httpx

from app import TaskOpts

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(process)d] [%(levelname)s] - %(message)s",
)
logger = logging.getLogger(__name__)

RESTATE_URL = "http://localhost:8080"
RESTATE_ADMIN_URL = "http://localhost:9070"


def submit_and_await_task(task: TaskOpts):
    idempotency_key = task.id
    logging.info(f"Submitting task with idempotency key: {idempotency_key}")

    # Submit the task; similar to publishing a message to a queue
    # Restate ensures the task is executed exactly once
    # Optionally set a delay for the task by adding `?delay=10s` to the URL
    # Use a stable uuid as an idempotency key; Restate deduplicates for us
    handle = httpx.post(
        f"{RESTATE_URL}/AsyncTaskWorker/run/send",
        json=task.model_dump(),
        headers={"idempotency-key": idempotency_key},
    )
    logging.info(f"Task submitted: {handle.json()}")

    # ... Do something else, with task running in the background ...

    # Attach back to the task to retrieve the result
    response = httpx.get(
        f"{RESTATE_URL}/restate/invocation/AsyncTaskWorker/run/{idempotency_key}/attach"
    )
    logging.info(f"Task result: {response.json()}")

    # Or cancel it
    invocation_id = handle.json().get("invocationId")
    response = httpx.delete(f"{RESTATE_ADMIN_URL}/invocations/{invocation_id}")
    if response.status_code == 202:
        logging.info(f"Task {invocation_id} cancelled successfully")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("id", type=str, help="Task ID")

    args = parser.parse_args()
    submit_and_await_task(TaskOpts(id=args.id))
