
import asyncio
import os
import minio

class ObjectStore:
    """Object Store client that wraps minio"""
    client: minio.Minio

    def __init__(self, endpoint: str, key: str, secret: str):
        self.client = minio.Minio(endpoint=endpoint,
                                  access_key=key,
                                  secret_key=secret,
                                  secure=False)

    async def aget_object(self, bucket_name: str, object_name: str):
        """Download object from minio"""

        def blocking_get():
            """minio API is blocking"""
            response = self.client.get_object(bucket_name=bucket_name, object_name=object_name)
            try:
                return response.data
            finally:
                response.close()
                response.release_conn()


        loop = asyncio.get_running_loop()
        return await loop.run_in_executor(None, blocking_get)

OBJECT_STORE: ObjectStore | None = None

def get_object_store_client() -> ObjectStore:
    """initialize or return cached minio client"""
    global OBJECT_STORE # pylint: disable=global-statement
    if OBJECT_STORE is None:
        endpoint = os.environ['MINIO_ENDPOINT']
        key = os.environ['MINIO_ACCESS_KEY']
        secret = os.environ['MINIO_SECRET_KEY']
        OBJECT_STORE = ObjectStore(endpoint=endpoint,
                                   key=key,
                                   secret=secret)
                  
    return OBJECT_STORE
