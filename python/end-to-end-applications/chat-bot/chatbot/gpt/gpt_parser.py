import json
from restate.exceptions import TerminalError

from chatbot.utils.types import Action, GptTaskCommand

def parse_to_command(response: str) -> GptTaskCommand:
    try:
        result = json.loads(response)
        if 'action' not in result:
            raise ValueError("property 'action' is missing")
        if 'message' not in result:
            raise ValueError("property 'message' is missing")
        return GptTaskCommand(
            action=Action(result["action"]),
            message=result["message"],
            task_name=result.get("task_name"),
            task_type=result.get("task_type"),
            task_spec=result.get("task_spec")
        )
    except (ValueError, json.JSONDecodeError) as e:
        raise TerminalError(f"Malformed response from LLM: {str(e)}.\nRaw response:\n{response}")
