"""core types"""

from typing import TypedDict

class NewPdfDocument(TypedDict):
    """A new document request """
    bucket_name: str
    object_name: str

class NewTextDocument(TypedDict):
    """A new document request """
    bucket_name: str
    object_name: str


