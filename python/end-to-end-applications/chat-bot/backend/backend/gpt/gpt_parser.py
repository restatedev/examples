import json

from restate.exceptions import TerminalError
from utils.types import GptTaskCommand


def parse_to_command(response: str) -> GptTaskCommand:
    try:
        result = json.loads(response)
        return GptTaskCommand(**result)
    except Exception as e:
        raise TerminalError(f"Malformed response from LLM: {str(e)}.\nRaw response:\n{response}")
