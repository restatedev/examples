# Async Tasks: Async Data Upload

This example shows how to use the Restate SDK to **kick of a synchronous task and turn it into an asynchronous one if it takes too long**.

The example implements a [data upload service](src/main/java/my/example/DataUploadService.java), that creates a bucket, uploads data to it, and then returns the URL.

The [upload client](src/main/java/my/example/UploadClient.java) does a synchronous request to upload the file, and the server will respond with the URL.

If the upload takes too long, however, the client asks the upload service to send the URL later in an email.

## Running the examples

1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell:
   `restate-server`

2. Start the service: `./gradlew run`

3. Register the example at Restate server by calling
   `restate -y deployment register localhost:9080`

4. Run the upload client with a userId: `./gradlew -PmainClass=my.example.UploadClient run --args="someone21"`
The workflow will run only once per ID, so you need to provide a new ID for each run.

5. Have a look at the logs to see how the execution switches from synchronously waiting to the response to requesting an email:

**Fast upload:**

Client logs:
```
2024-12-18 15:02:34 INFO   my.example.UploadClient - Uploading data for user someone212
2024-12-18 15:02:36 INFO   my.example.UploadClient - Fast upload... URL was https://s3-eu-central-1.amazonaws.com/257587941/
```
Workflow logs:
```
2024-12-18 15:02:34 INFO  [DataUploadService/run][inv_17cZwACLnO7f5m1BjN7SKoQpuyycCmWwnv] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-18 15:02:34 INFO  [DataUploadService/run][inv_17cZwACLnO7f5m1BjN7SKoQpuyycCmWwnv] my.example.utils.DataOperations - Creating bucket with URL https://s3-eu-central-1.amazonaws.com/257587941/
2024-12-18 15:02:34 INFO  [DataUploadService/run][inv_17cZwACLnO7f5m1BjN7SKoQpuyycCmWwnv] my.example.utils.DataOperations - Uploading data to target https://s3-eu-central-1.amazonaws.com/257587941/. ETA: 1500 ms
2024-12-18 15:02:36 INFO  [DataUploadService/run][inv_17cZwACLnO7f5m1BjN7SKoQpuyycCmWwnv] dev.restate.sdk.core.InvocationStateMachine - End invocation
```

**Slow upload**:

Client logs:
```
2024-12-18 15:02:41 INFO   my.example.UploadClient - Uploading data for user someone2122
2024-12-18 15:02:46 INFO   my.example.UploadClient - Slow upload... Mail the link later
```

Workflow logs:
```
2024-12-18 15:02:41 INFO  [DataUploadService/run][inv_1koakM2GXxcN2Co3aM3pSrQJokiqnyR7MJ] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-18 15:02:41 INFO  [DataUploadService/run][inv_1koakM2GXxcN2Co3aM3pSrQJokiqnyR7MJ] my.example.utils.DataOperations - Creating bucket with URL https://s3-eu-central-1.amazonaws.com/493004051/
2024-12-18 15:02:41 INFO  [DataUploadService/run][inv_1koakM2GXxcN2Co3aM3pSrQJokiqnyR7MJ] my.example.utils.DataOperations - Uploading data to target https://s3-eu-central-1.amazonaws.com/493004051/. ETA: 10000 ms
2024-12-18 15:02:46 INFO  [DataUploadService/resultAsEmail][inv_1koakM2GXxcN7veCWCBDo77G0P2BIX7KFz] dev.restate.sdk.core.InvocationStateMachine - Start invocation
2024-12-18 15:02:51 INFO  [DataUploadService/run][inv_1koakM2GXxcN2Co3aM3pSrQJokiqnyR7MJ] dev.restate.sdk.core.InvocationStateMachine - End invocation
2024-12-18 15:02:51 INFO  [DataUploadService/resultAsEmail][inv_1koakM2GXxcN7veCWCBDo77G0P2BIX7KFz] my.example.utils.EmailClient - Sending email to https://s3-eu-central-1.amazonaws.com/493004051/ with url someone2122@example.com
2024-12-18 15:02:51 INFO  [DataUploadService/resultAsEmail][inv_1koakM2GXxcN7veCWCBDo77G0P2BIX7KFz] dev.restate.sdk.core.InvocationStateMachine - End invocation
```
You see the call to `resultAsEmail` after the upload took too long, and the sending of the email.