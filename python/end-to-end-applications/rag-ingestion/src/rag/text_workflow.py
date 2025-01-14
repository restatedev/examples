import restate

from langchain_text_splitters import RecursiveCharacterTextSplitter

from . types import NewTextDocument
from . object_store import get_object_store_client
from . vector_store import get_vector_store
from . embeddings import get_embeddings_model

text_workflow = restate.Workflow('text')

@text_workflow.main()
async def process_text(ctx: restate.WorkflowContext, request: NewTextDocument):
    """Text ingestion workflow"""
    #
    # 1. Download the text file
    #

    async def download() -> str:
        object_store = get_object_store_client()
        text_bytes = await object_store.aget_object(request["bucket_name"], request["object_name"])
        return text_bytes.decode("utf-8")

    text: str = await ctx.run("Download", download)

    #
    # 2. Extract the snippets from the PDF
    #
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_text(text)

    #
    # 3. Compute embeddings for the text snippets
    #

    async def compute_embeddings():
        model = get_embeddings_model()
        vectors = await model.aembed_documents(chunks)
        return vectors

    vectors = await ctx.run("compute embeddings", compute_embeddings)

    #
    # 4. Add the documents to the vector store
    #

    async def add_documents():
        metadata = { "object_name": request["object_name"], "bucket_name": request["bucket_name"] }
        store = get_vector_store()
        await store.aupsert(chunks, vectors, metadata)

    await ctx.run("Add documents", add_documents)

    return "ok"
