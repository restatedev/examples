# RAG Ingestion Workflow with Restate's Python SDK 

This repository contains a complete example of how to ingest documents to be used later for RAG.
Upload a file to an S3 bucket (minio in this demo) and see it appear in a vector database.

This demo:
* Shows how to use restate a reliable and resilient recipient of webhooks 
* How to use [LangChain](https://www.langchain.com/) with restate
* Using Restate's [workflows in Python](https://docs.restate.dev/develop/python/workflows).

## Running the example

1. Setup ollama locally to download the model
    
    ```
    docker compose pull
    docker compose build
    docker compose up
    ```

2. From a separate terminal, download the embedding model.
We are using `mxbai-embed-large`:

    ```bash
    curl http://localhost:11434/api/pull -d '{ "name": "mxbai-embed-large" }'
    ```

3. All done, now you can go and upload files to this bucket!

* Minio console [Minio](http://localhost:9001/browser/docs) - user/password: `minioadmin` 
* Qdrant [Qdrant](http://localhost:6333/dashboard#/collections)


## Demo script

* Upload any `.txt` / `.pdf` file into the [docs](http://localhost:9001/browser/docs) bucket
* Watch new vectors appear at [docs collection](http://localhost:6333/dashboard#/collections/docs)

## To teardown

```
docker-compose down --remove-orphans
```

# Browse the code / Local development

## Using virtual environments:

```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```
