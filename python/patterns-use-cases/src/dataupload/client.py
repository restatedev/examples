import argparse
import logging
import requests
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] [%(process)d] [%(levelname)s] - %(message)s')


class User(BaseModel):
    id: str
    email: str


RESTATE_URL = "http://localhost:8080"
headers = {"Content-Type": "application/json"}


# The upload client calls the data upload workflow and awaits the result for 5 seconds.
# If the workflow doesn't complete within that time, it asks the
# workflow to send the upload url via email instead.
def upload_data(user: User):
    logging.info(f"Start upload for {user.id}")

    try:
        url = f"{RESTATE_URL}/DataUploadService/{user.id}/run"
        upload_url = requests.post(url, headers=headers, timeout=5).json()
    except requests.exceptions.Timeout:
        logging.info("Slow upload... Mail the link later")
        email_url = f"{RESTATE_URL}/DataUploadService/{user.id}/resultAsEmail/send"
        requests.post(email_url, json=user.email, headers=headers)
        return

    # ... process result directly ...
    logging.info(f"Fast upload: URL was {upload_url}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("id", type=str, help="User ID")

    args = parser.parse_args()
    upload_data(User(id=args.id, email=f"{args.id}@example.com"))
