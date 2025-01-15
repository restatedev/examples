"""Simple restate application"""

import restate

from webhook import docs
from rag.pdf_workflow import pdf_workflow
from rag.text_workflow import text_workflow
from rag.embeddings_service import embeddings_service

app = restate.app(services=[docs,
                            text_workflow,
                            pdf_workflow,
                            embeddings_service
                            ])
