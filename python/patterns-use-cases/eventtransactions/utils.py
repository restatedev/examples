import logging
import random
import uuid

from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] [%(process)d] [%(levelname)s] - %(message)s')
logger = logging.getLogger(__name__)

class SocialMediaPost(BaseModel):
    content: str
    metadata: str


class Status:
    PENDING = "PENDING"
    DONE = "DONE"


def create_post(user_id: str, post: SocialMediaPost) -> str:
    post_id = str(uuid.uuid4())
    logging.info(f"Created post {post_id} for user {user_id} with content: {post.content}")
    return post_id


def get_post_status(post_id: str) -> str:
    if random.random() < 0.8:
        logging.info(f"Content moderation for post {post_id} is still pending... Will check again in 5 seconds")
        return Status.PENDING
    else:
        logging.info(f"Content moderation for post {post_id} is done")
        return Status.DONE


def update_user_feed(user: str, post_id: str):
    logging.info(f"Updating the user feed for user {user} with post {post_id}")
