import logging
import os
import sys

import requests
from typing import List

from chatbot.utils.types import ChatEntry

OPENAI_API_KEY = os.getenv("OPENAI_API_KEY")
if not OPENAI_API_KEY:
    logging.error("Missing OPENAI_API_KEY environment variable")
    sys.exit(1)

OPENAI_ENDPOINT = "https://api.openai.com/v1/chat/completions"
MODEL = "gpt-4o"
TEMPERATURE = 0.2  # use more stable (less random / creative) responses

MODE = os.environ.get("MODE", "CONSOLE")

def chat(prompt: List[ChatEntry]) -> str:
    """
    Chat with the model using the given user prompts.
    """
    try:
        body = {
            "model": MODEL,
            "temperature": TEMPERATURE,
            "messages": prompt
        }

        response = requests.post(
            OPENAI_ENDPOINT,
            headers={
                "Authorization": f"Bearer {OPENAI_API_KEY}",
                "Content-Type": "application/json"
            },
            json=body,
            timeout=60, # wait for up to 60 seconds for a response
        )

        if not response.ok:
            raise ValueError(f"{response.status_code} : {response.text}")

        data = response.json()
        return data["choices"][0]["message"]["content"]
    except Exception as error:
        logging.error("Error calling model %s at %s: %s", MODEL, OPENAI_ENDPOINT, error)
        raise error
