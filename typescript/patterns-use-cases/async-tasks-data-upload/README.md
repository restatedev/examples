# Async Tasks: Async Data Upload  

This example shows how to use the Restate SDK to **kick of a synchronous task and turn it into an asynchronous one if it takes too long**.

The example implements a [data upload service](src/data_upload_service.ts), that creates a bucket, uploads data to it, and then returns the URL.

The [client](src/client.ts) does a synchronous request to upload the file, and the server will respond with the URL.

If the upload takes too long, however, the client asks the upload service to send the URL later in an email.


## Running the examples

1. Make sure you have installed the dependencies: `npm install`.

2. Start Restate Server in a separate shell: `npx restate-server`

3. Start the data upload service: `npm run app-dev`

4. Register the example at Restate server by calling
   `npx restate -y deployment register "localhost:9080"`.

5. Run the client to submit and upload request: `npm run client`

6. Have a look at the logs to see how the execution switches from synchronously waiting to the respose to requesting an email.
