"""I'm AI"""
from typing import Dict, Any

import restate
from restate.exceptions import TerminalError

from rag.types import NewPdfDocument, NewTextDocument
from rag.pdf_workflow import process_pdf
from rag.text_workflow import process_text

docs = restate.Service('docs')

@docs.handler()
async def webhook(ctx: restate.Context, event: Dict[str, Any]):
    """Webhook handler"""

    if event.get('EventName') != 's3:ObjectCreated:Put':
        raise TerminalError("Can only support Put events.")

    s3_event = event['Records'][0]['s3']
    bucket_name: str = s3_event['bucket']['name']
    object_name: str = s3_event['object']['key']
    content_type: str = s3_event['object']['contentType']
    event_id: str = s3_event['object']['sequencer']

    if content_type == "application/pdf":
        ctx.workflow_send(process_pdf,
                          key=event_id,
                          arg=NewPdfDocument(bucket_name=bucket_name,
                                             object_name=object_name))
    elif content_type == "text/plain":
        ctx.workflow_send(process_text,
                          key=event_id,
                          arg=NewTextDocument(bucket_name=bucket_name,
                                             object_name=object_name))
    else:
        raise TerminalError(f"Unsupported content type: {content_type}")

    return "ok"
