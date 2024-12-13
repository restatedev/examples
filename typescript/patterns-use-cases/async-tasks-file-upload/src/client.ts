import * as restate from "@restatedev/restate-sdk-clients";
import { DataUploadService } from "./data_upload_service";
import {Timeout, withTimeout} from "./utils";

// Client:
//
// The client calls the data upload workflow and awaits the result for 30 seconds.
// If the workflow doesn't complete within that time, it asks the
// workflow to send the upload url via email instead.
const RESTATE_URL = "http://localhost:8080";
const restateClient = restate.connect({ url: RESTATE_URL });

async function downloadData(user: { id: string, email: string }) {
  const dataUploader = restateClient.workflowClient<DataUploadService>({ name: "dataUploader" }, user.id);
  await dataUploader.workflowSubmit();

  const result = await withTimeout(dataUploader.workflowAttach(), 30_000);

  if (result === Timeout) {
    // Hit timeout... Mail us the link later
    await dataUploader.resultAsEmail({ email: user.email });
    return;
  }
  // ... process directly ...
}