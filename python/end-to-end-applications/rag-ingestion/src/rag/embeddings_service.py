import restate

from . embeddings import get_embeddings_model

embeddings_service = restate.Service('embeddings')

@embeddings_service.handler()
async def compute_embedding(_ctx, text: str):
    """Compute embeddings for the text chunks"""
    model = get_embeddings_model()
    vectors = await model.aembed_documents([text])
    return vectors[0]
