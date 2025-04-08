import json

from restate.exceptions import TerminalError
from utils.types import GptTaskCommand


def parse_to_command(response: str) -> GptTaskCommand:
    try:
        result = json.loads(response)
        if "action" not in result:
            raise ValueError("property 'action' is missing")
        if "message" not in result:
            raise ValueError("property 'message' is missing")
        return GptTaskCommand(**result)
    except (ValueError, json.JSONDecodeError) as e:
        raise TerminalError(
            f"Malformed response from LLM: {str(e)}.\nRaw response:\n{response}"
        )
