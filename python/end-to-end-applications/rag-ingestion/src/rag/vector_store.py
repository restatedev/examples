import asyncio
from hashlib import sha256
import os
import threading
import uuid
from langchain_qdrant import QdrantVectorStore
from qdrant_client import QdrantClient, models

from . embeddings import get_embeddings_model


class VectorStore:
    """Wrapper around the Qdrant vector store client"""
    store: QdrantVectorStore

    def __init__(self, store) -> None:
        self.store = store

    async def aupsert(self, texts, vectors, metadata):
        """Convert texts and embeddings to the Qdrant points and upsert them"""
        points = []
        for text, vector in zip(texts, vectors):
            text_hash = sha256(text.encode()).digest()
            point_id = uuid.UUID(bytes=text_hash[:16]).hex
            payload = metadata.copy()
            payload["page_content"] = text
            point = models.PointStruct(id=point_id, vector={ "" : vector}, payload = payload)
            points.append(point)

        client = self.store.client
        
        def task():
            client.upsert(collection_name="docs", points=points, wait=False)

        loop = asyncio.get_event_loop()
        await loop.run_in_executor(None, task)

VECTOR_STORE: VectorStore | None = None
LOCK = threading.Lock()

def get_vector_store() -> VectorStore:
    """initialize or return cached vector store client"""
    global VECTOR_STORE # pylint: disable=global-statement
    with LOCK:
        if VECTOR_STORE is not None:
            return VECTOR_STORE

        host = os.environ['QDRANT_HOST']
        client = QdrantClient(url=host, prefer_grpc=True)
        emb = get_embeddings_model()
        if client.collection_exists("docs"):
            store = QdrantVectorStore.from_existing_collection(
                collection_name="docs",
                embedding=emb,
                host=host,
                prefer_grpc=True)
            VECTOR_STORE = VectorStore(store)
        else:
            store = QdrantVectorStore.from_texts(
                texts=[],
                embedding=emb,
                collection_name="docs",
                host=host,
                prefer_grpc=True)
            VECTOR_STORE = VectorStore(store)
        return VECTOR_STORE
