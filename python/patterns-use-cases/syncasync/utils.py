import asyncio
import logging
import random


async def create_s3_bucket() -> str:
    bucket = str(int(random.random() * 1_000_000_000))
    bucket_url = f"https://s3-eu-central-1.amazonaws.com/{bucket}/"
    logging.info(f" Creating bucket with URL {bucket_url}")
    return bucket_url


async def upload_data(target: str) -> None:
    time_remaining = 1.5 if random.random() < 0.5 else 10
    logging.info(f"Uploading data to target {target}. ETA: {time_remaining}s")
    await asyncio.sleep(time_remaining)


async def send_email(email: str, url: str) -> None:
    logging.info(f"Sending email to '{email}' with URL {url}")
