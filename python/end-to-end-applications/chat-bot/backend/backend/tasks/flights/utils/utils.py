from typing import Any


def parse_currency(text: Any) -> int:
    if isinstance(text, (int, float)):
        return int(text)
    if isinstance(text, str):
        text = text.strip().lower()
        num_string = text.split(" ")[0]
        return int(num_string)
    raise ValueError(f"Unknown type: {type(text)}")
