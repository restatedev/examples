//
// import * as restate from "../src/public_api";
// import { randomUUID } from "crypto";
// import { workflow } from "../src/workflows/workflow";
// import axios from "axios";
// import {HttpClient} from "./http_client";
//
// /* eslint-disable no-console */
//
// // ------------- NOTE !!! ------------------
// // unlike the other dev samples, this one includes a client and interaction
// // with the workflow, so it needs a running Restate runtime.
// // The protocol switched to a new version some days ago, so one needs the
// // latest nightly runtime build to run the current SDK main branch.
// //
// // start that via:
// // docker run --name restate_dev --rm -p 8080:8080 -p 9070:9070 -p 9071:9071 --add-host=host.docker.internal:host-gateway ghcr.io/restatedev/restate:main
//
// const restateIngressUrl = process.argv[2] || "http://localhost:8080";
// const restateAdminUrl = process.argv[3] || "http://localhost:9070";
// const serviceHost = process.argv[4] || "host.docker.internal";
//
// type Machine = {
//   gpu: boolean;
//   os: string;
//   name: string;
// };
//
// type Software = {
//   package: string;
// };
//
// type Spec = {
//   network: "slow" | "fast" ;
//   machines: Array<Machine>;
//   software: Array<Software>;
// };
//
// type ProvisionRequest = {
//   projectId: string;
//   spec: Spec;
// };
//
// const myworkflow = restate.workflow.workflow("acme.myworkflow", {
//   run: async (ctx: restate.workflow.WfContext, params: ProvisionRequest) => {
//     ctx.set("projectId", params.projectId);
//
//     // store this in an audit database
//     await ctx.sideEffect(async () =>
//         postgresql(
//             `INSERT INTO audit(project_id, workflow_id, request) VALUES (?,?)`,
//             ctx.workflowId,
//             params.spec
//         )
//     );
//
//     // translate the network type from the spec to something we know.
//     const network = await ctx.sideEffect(async () =>
//         postgresql(
//             `SELECT network FROM networks WHERE network_type = ?`,
//             params.spec.network
//         )
//     );
//     if (!network) {
//       throw new restate.TerminalError("unknown network type" + params.spec.network);
//     }
//
//     // Ask a human to approve our spec.
//     const approvalPromise = ctx.awakeable();
//     await ctx.sideEffect(async () => {
//       const url = `restate:8080/workflow/Resolve`;
//       await HttpClient.send(`https://backoffice.provision.infra/callback=${url}`,
//           { spec : params.spec , id : approvalPromise.id });
//     });
//     await approvalPromise.promise;
//
//     /// .......
//   },
//
//   // Workflows may have an arbitrary number of other functions that take
//   // a 'SharedWfContext' and have shared access to state and promises
//   signal: async (
//       ctx: restate.workflow.SharedWfContext,
//       req: { signal: string }
//   ) => {
//     ctx.promise<string>("thesignal").resolve(req.signal);
//   },
//
//   getName: async (ctx: restate.workflow.SharedWfContext): Promise<string> => {
//     return (await ctx.get("name")) ?? "(not yet set)";
//   },
//
//   awaitName: async (ctx: restate.workflow.SharedWfContext): Promise<string> => {
//     return ctx.promise<string>("name_promise").promise();
//   },
// });
//
// // typed API similar to how other Restate RPC services work
// const workflowApi = myworkflow.api;
//
// restate.createServer().bind(myworkflow).listen(9080);
//
// //
// // (2) Code to interact with the workflow using an external client
// //
// // This submits a workflow and sends signals / queries to the workflow.
// //
// async function startWorkflowAndInteract(restateUrl: string) {
//   const restateServer = restate.clients.connect(restateUrl);
//
//   const args = { name: "Restatearius" };
//   const workflowId = randomUUID();
//
// // Option a) we can create clients either with just the workflow service path
//   const submit1 = await restateServer.submitWorkflow(
//       "acme.myworkflow",
//       workflowId,
//       args
//   );
//   console.log("Submitted workflow with result: " + submit1.status);
//
// // Option b) we can supply the API signature and get a typed interface for all the methods
// // Because the submit is idempotent, this call here will effectively attach to the
// // previous workflow
//   const submit2 = await restateServer.submitWorkflow(
//       workflowApi,
//       workflowId,
//       args
//   );
//   console.log("Submitted workflow with result: " + submit2.status);
//   const client = submit2.client;
//
// // check the status (should be RUNNING)
//   const status = await client.status();
//   console.log("Workflow status: " + status);
//
// // call method that reads the 'name' state
//   const get_name = await client.workflowInterface().getName();
//   console.log("Workflow getName() (snapshot read): " + get_name);
//
// // call method that awaits the 'name' promise
//   const await_name = await client.workflowInterface().awaitName();
//   console.log("Workflow awaitName() (promise): " + await_name);
//
// // send a signal
//   client.workflowInterface().signal({ signal: "hey ho!" });
//
// // wait until everything is done
//   const result = await client.result();
//   console.log("Workflow result: " + result);
// }
//
// //
// // (3) To make this example work end-to-end, with the external client below,
// // we issue a registration here
// //
// registerDeployment(restateAdminUrl, 9080)
//     .then(() => startWorkflowAndInteract(restateIngressUrl))
//     .then(() => process.exit(0))
//     .catch((err) => {
//       console.error(err);
//       process.exit(-1);
//     });
//
// // --------------------- utils -----------------
//
// async function registerDeployment(restateAdminAddress: string, port: number) {
//   const serviceEndpoint = `http://${serviceHost}:${port}`;
//   const httpResponse = await fetch(restateAdminAddress + "/deployments", {
//     method: "POST",
//     headers: {
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify({
//       uri: serviceEndpoint,
//     }),
//   });
//
//   const responseText = await httpResponse.text();
//   if (!httpResponse.ok) {
//     throw new Error(
//         `Registration failed: STATUS ${httpResponse.status} ; ${responseText}`
//     );
//   } else {
//     return `Registration succeeded: STATUS ${httpResponse.status} ; ${responseText}`;
//   }
// }
// async function postgresql(arg0: string, ...args) {
//   return "net";
// }
