import * as restate from "@restatedev/restate-sdk";
import {
  WorkflowContext,
  WorkflowSharedContext,
} from "@restatedev/restate-sdk";
import {createS3Bucket, sendEmail, uploadData} from "./utils";

const dataUploadService = restate.workflow({
  name: "dataUploader",
  handlers: {
    run: async (ctx: WorkflowContext) => {
      const url = await ctx.run(() => createS3Bucket());
      await ctx.run(() => uploadData(url));

      await ctx.promise<URL>("url").resolve(url);
      return url;
    },

    resultAsEmail: async (
      ctx: WorkflowSharedContext,
      req: { email: string }
    ) => {
      const url = await ctx.promise<URL>("url");
      await ctx.run(() => sendEmail(url, req.email));
    },
  },
});

export type DataUploadService = typeof dataUploadService;

restate.endpoint().bind(dataUploadService).listen(8080);
