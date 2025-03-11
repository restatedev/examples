from typing import TypeVar, Any


def parse_currency(text: Any) -> int:
    if isinstance(text, (int, float)):
        return int(text)
    if isinstance(text, str):
        text = text.strip().lower()
        num_string = text.split(" ")[0]
        return int(num_string)
    raise ValueError(f"Unknown type: {type(text)}")


T = TypeVar('T')


def check_field(spec: Any, field_name: str) -> T:
    value = spec.get(field_name)
    if value is None:
        raise ValueError(f"Missing field '{field_name}'")
    return value
