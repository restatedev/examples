import * as restate from "@restatedev/restate-sdk-clients";
import { DataUploadService } from "./data_upload_service";
import { withTimeout } from "./utils";
import { randomUUID } from "node:crypto";

// The upload client calls the data upload workflow and awaits the result for 5 seconds.
// If the workflow doesn't complete within that time, it asks the
// workflow to send the upload url via email instead.
const RESTATE_URL = "http://localhost:8080";
const restateClient = restate.connect({ url: RESTATE_URL });

async function uploadData(user: { id: string; email: string }) {
  console.info(`Start upload for ${user.id}`);

  const uploadClient = restateClient.workflowClient<DataUploadService>(
    { name: "dataUploader" },
    user.id
  );
  await uploadClient.workflowSubmit();

  let uploadUrl;
  try {
    uploadUrl = await withTimeout(uploadClient.workflowAttach(), 5000);
  } catch (e) {
    console.info("Slow upload... Mail the link later");
    uploadClient.resultAsEmail({ email: user.email });
    return;
  }

  // ... process directly ...
  console.info(`Fast upload: URL was ${uploadUrl}`);
}

uploadData({ id: randomUUID().toString(), email: "user@example.com" });
