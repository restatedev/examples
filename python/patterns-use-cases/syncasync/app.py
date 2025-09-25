import logging
import restate

from utils import upload_data, create_s3_bucket, send_email

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(process)d] [%(levelname)s] - %(message)s",
)
logger = logging.getLogger(__name__)

data_upload_service = restate.Workflow("DataUploadService")


@data_upload_service.main()
async def run(ctx: restate.WorkflowContext) -> str:
    url = await ctx.run_typed("bucket creation", create_s3_bucket)

    await ctx.run_typed("upload", upload_data, target=url)

    await ctx.promise("url").resolve(url)
    return url


@data_upload_service.handler("resultAsEmail")
async def result_as_email(ctx: restate.WorkflowSharedContext, email: str):
    logging.info("Slow upload: client requested to be notified via email")
    url = await ctx.promise("url").value()
    await ctx.run_type(
        "email",
        send_email,
        email=email,
        url=url,
    )


app = restate.app([data_upload_service])


if __name__ == "__main__":
    import hypercorn
    import asyncio

    conf = hypercorn.Config()
    conf.bind = ["0.0.0.0:9080"]
    asyncio.run(hypercorn.asyncio.serve(app, conf))
