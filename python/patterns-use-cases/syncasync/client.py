import argparse
import logging
import httpx

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] [%(process)d] [%(levelname)s] - %(message)s')
logger = logging.getLogger(__name__)


RESTATE_URL = "http://localhost:8080"


# The upload client calls the data upload workflow and awaits the result for 5 seconds.
# If the workflow doesn't complete within that time, it asks the
# workflow to send the upload url via email instead.
def upload_data(id: str, email: str):
    logging.info(f"Start upload for {id}")

    try:
        url = f"{RESTATE_URL}/DataUploadService/{id}/run"
        upload_url = httpx.post(url, timeout=5).json()
    except httpx.RequestError:
        logging.info("Slow upload... Mail the link later")
        email_url = f"{RESTATE_URL}/DataUploadService/{id}/resultAsEmail/send"
        httpx.post(email_url, json=email)
        return

    # ... process result directly ...
    logging.info(f"Fast upload: URL was {upload_url}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("id", type=str, help="User ID")

    args = parser.parse_args()
    upload_data(id=args.id, email=f"{args.id}@example.com")
