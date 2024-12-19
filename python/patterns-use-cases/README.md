# Java Patterns and Use Cases

To get started, create a venv and install the requirements file:

```shell
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## Async Tasks: Async Data Upload  

This example shows how to use the Restate SDK to **kick of a synchronous task and turn it into an asynchronous one if it takes too long**.

The example implements a [data upload service](src/dataupload/data_upload_service.py), that creates a bucket, uploads data to it, and then returns the URL.

The [client](src/dataupload/client.py) does a synchronous request to upload the file, and the server will respond with the URL.

If the upload takes too long, however, the client asks the upload service to send the URL later in an email.


### Running the examples

1. [Start the Restate Server](https://docs.restate.dev/develop/local_dev) in a separate shell: `restate-server`
2. Start the service: `python -m hypercorn --config hypercorn-config.toml src/dataupload/data_upload_service:app`
3. Register the services (with `--force` to override the endpoint during **development**): `restate -y deployments register --force localhost:9080` 

### Demo scenario

Run the upload client with a userId: `python src/dataupload/client.py`

curl -X POST localhost:8080/DataUploadService/package1/run

This will submit an upload workflow to the data upload service.
The workflow will run only once per ID, so you need to provide a new ID for each run.

Have a look at the logs to see how the execution switches from synchronously waiting to the response to requesting an email:

#### Fast upload

Client logs:
```
[2024-12-19 12:30:02,072] [667791] [INFO] - Start upload for my_user_id12
[2024-12-19 12:30:03,597] [667791] [INFO] - Fast upload: URL was https://s3-eu-central-1.amazonaws.com/282507974/
```
Workflow logs:
```
[2024-12-19 12:30:02,084] [667381] [INFO] -  Creating bucket with URL https://s3-eu-central-1.amazonaws.com/282507974/
[2024-12-19 12:30:02,085] [667381] [INFO] - Uploading data to target https://s3-eu-central-1.amazonaws.com/282507974/. ETA: 1.5s
```

#### Slow upload

Client logs:
```
[2024-12-19 12:28:33,471] [667526] [INFO] - Start upload for my_user_id123
[2024-12-19 12:28:38,477] [667526] [INFO] - Slow upload... Mail the link later

```

Workflow logs:
```
[2024-12-19 12:28:33,481] [667383] [INFO] -  Creating bucket with URL https://s3-eu-central-1.amazonaws.com/23907419/
[2024-12-19 12:28:33,483] [667383] [INFO] - Uploading data to target https://s3-eu-central-1.amazonaws.com/23907419/. ETA: 10s
[2024-12-19 12:28:38,486] [667383] [INFO] - Slow upload: client requested to be notified via email
[2024-12-19 12:28:43,493] [667383] [INFO] - Sending email to my_user_id123@example.com with URL 'https://s3-eu-central-1.amazonaws.com/23907419/'
```

You see the call to `resultAsEmail` after the upload took too long, and the sending of the email.

