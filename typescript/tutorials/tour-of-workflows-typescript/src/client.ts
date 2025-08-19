import * as clients from "@restatedev/restate-sdk-clients";
import {signupWorkflow} from "./getstarted/app";

async function submitWorkflow({id, name, email}: {id: string, name: string, email: string}) {
  const restateClient = clients.connect({url: "http://localhost:8080"});

  const handle = await restateClient
      .workflowClient(signupWorkflow, id)
      .workflowSubmit({name, email});
  return await restateClient.result(handle);
}

submitWorkflow({id: "user-123", name: "John Doe", email: "john@mail.com"})