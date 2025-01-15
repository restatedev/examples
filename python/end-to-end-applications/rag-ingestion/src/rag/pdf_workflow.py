from typing import List

import restate
from restate.serde import BytesSerde

from langchain_community.document_loaders.parsers import PyPDFParser
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.document_loaders.blob_loaders import Blob

from . types import NewPdfDocument
from . object_store import get_object_store_client
from . vector_store import get_vector_store
from . embeddings_service import compute_embedding

pdf_workflow = restate.Workflow('pdf')

def extract_pdf_text_snippets(pdf_bytes: bytes) -> List[str]:
    """Extract text from PDF"""
    parser = PyPDFParser()
    docs = parser.parse(Blob.from_data(data=pdf_bytes, mime_type="application/pdf"))
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
    chunks = text_splitter.split_documents(docs)
    return [chunk.page_content for chunk in chunks]

@pdf_workflow.main()
async def process_pdf(ctx: restate.WorkflowContext, request: NewPdfDocument):
    """PDF ingestion workflow"""
    #
    # 1. Download the PDF
    #

    async def download_pdf() -> bytes:
        object_store = get_object_store_client()
        return await object_store.aget_object(request["bucket_name"], request["object_name"])

    pdf_bytes = await ctx.run("Download PDF", download_pdf, serde=BytesSerde())

    #
    # 2. Extract the snippets from the PDF
    #

    texts = extract_pdf_text_snippets(pdf_bytes)

    #
    # 3. Compute embeddings for the text snippets
    #

    vector_futures = [ctx.service_call(compute_embedding, arg=text) for text in texts]
    vectors = [await vector for vector in vector_futures]

    #
    # 4. Add the documents to the vector store
    #

    async def add_documents():
        metadata = { "object_name": request["object_name"], "bucket_name": request["bucket_name"] }
        store = get_vector_store()
        await store.aupsert(texts, vectors, metadata)

    await ctx.run("Add documents", add_documents)

    return "ok"
