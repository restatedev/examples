import os
from langchain_ollama import OllamaEmbeddings

EMBEDDINGS: OllamaEmbeddings | None = None

def get_embeddings_model() -> OllamaEmbeddings:
    """initialize or return cached embeddings client"""
    global EMBEDDINGS # pylint: disable=global-statement
    if EMBEDDINGS is None:
        model = os.environ['OLLAMA_MODEL']
        ollama_host = os.environ['OLLAMA_HOST']
        EMBEDDINGS = OllamaEmbeddings(model=model, base_url=ollama_host)
    return EMBEDDINGS
