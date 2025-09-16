import * as clients from "@restatedev/restate-sdk-clients";
import { signupWorkflow } from "./workflows/signup-workflow";

async function submitWorkflow({
  id,
  name,
  email,
}: {
  id: string;
  name: string;
  email: string;
}) {
  // <start_submit>
  const restateClient = clients.connect({ url: "http://localhost:8080" });

  const handle = await restateClient
    .workflowClient(signupWorkflow, id)
    .workflowSubmit({ name, email });
  const result = await restateClient.result(handle);
  // <end_submit>

  return result;
}

submitWorkflow({ id: "user-123", name: "John Doe", email: "john@mail.com" });
