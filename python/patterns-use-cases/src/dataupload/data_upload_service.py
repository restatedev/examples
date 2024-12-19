import restate
import logging
from restate import WorkflowContext, WorkflowSharedContext, Workflow

from src.dataupload.utils import upload_data, create_s3_bucket, send_email

logging.basicConfig(level=logging.INFO, format='[%(asctime)s] [%(process)d] [%(levelname)s] - %(message)s')

data_upload_service = Workflow("DataUploadService")


@data_upload_service.main()
async def run(ctx: WorkflowContext) -> str:
    url = await ctx.run("bucket creation", create_s3_bucket)

    async def upload():
        await upload_data(url)

    await ctx.run("upload", upload)

    await ctx.promise("url").resolve(url)
    return url


@data_upload_service.handler("resultAsEmail")
async def result_as_email(ctx: WorkflowSharedContext, email: str):
    logging.info("Slow upload: client requested to be notified via email")
    url = await ctx.promise("url").value()

    async def send():
        await send_email(email, url)
    await ctx.run("email", send)


app = restate.app([data_upload_service])
