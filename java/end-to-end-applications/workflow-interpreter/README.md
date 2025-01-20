# Image Workflow Parser & Executor

This example implements a workflow that executes various AI image processing steps,
like image generation and transformations.

The workflow is specified dynamically in a json-based workflow definition.
The workflow can contain steps that call different image processing services:
- to generate images by taking a screenshot with Puppeteer
- to rotate images
- to blur images


- A client sends an HTTP request to the ImageProcessingWorkflow
- The workflow parses the JSON workflow definition
- The workflow calls the specified services in the workflow definition in the correct order 
  - calls to PuppeteerService 
  - calls to TransformerService with /blur and /rotate
- Results are concatenated and returned to the client

```txt
+--------+ Request +------------------------+
| Client | ------> | ImageProcessingWorkflow|
+--------+         +------------------------+
    ^                          |
    |                          | Parse JSON workflow definition
    |                          v
    |              +------------------------+
    |              |   Workflow Execution   |----+
    |              +------------------------+    |
    |                          |                 |
    |                          |    +------------------------+
    |                          |    | Optional Services      |
    |                          |    | (any order)            |
    |                          |    |  +-----------------+   |
    |                          |    |  | PuppeteerService|   |
    |                          |    |  +-----------------+   |
    |                          |    |  | TransformerSvc  |   |
    |                          |    |  | (/blur)         |   |
    |                          |    |  +-----------------+   |
    |                          |    |  | TransformerSvc  |   |
    |                          |    |  | (/rotate)       |   |
    |                          |    |  +-----------------+   |
    |                          |    +------------------------+
    |                          |                 |
    |                          <-----------------+
    |                          |
    |                          | Concatenate
    |                          v
    |              +------------------------+
    |              |    Result Assembly     |
    |              +------------------------+
    |                          |
    +<-------------------------|
           Result Report

```

**Note:** For simplicity, this example stores images locally in the folder `generated-images`.

The example deploys each of the possible steps (generation, transformation) as
a separate service, and then has a workflow service call them as specified in the
workflow definition.

## Download the example

You can clone the example repository (`git clone https://github.com/restatedev/examples`) or just download this example via

- **CLI:** `restate example java-image-workflows`

- **Zip archive:** https://github.com/restatedev/examples/releases/latest/download/java-image-workflows.zip

## Running the example

1. Start Restate Server in a separate shell: `restate-server`

2. Start the workflow and image transformation services: `mvn compile spring-boot:run`

3. Register the example at Restate server by calling
   `restate -y deployment register "localhost:9080"`.

## Demo scenario

Here is list of example workflow execution requests that you can send to the workflow executor:

### Example workflow
Puppeteer screenshot -> rotate -> blur:

```shell
curl localhost:8080/ImageProcessingWorkflow/user123-wf1/run -H 'content-type: application/json' \
  -d '[
          {"action":"puppeteer","parameters":{"url":"https://restate.dev"}},
          {"action":"rotate","parameters":{"angle":90}},
          {"action":"blur","parameters":{"blur":5}}
       ]'
```

Have a look at the `generated-images` folder to see the end result.

### Retrieving state
You can retrieve the workflow state via via the CLI.
For example for id `user123-wf1`, do:

```shell
restate kv get ImageProcessingWorkflow user123-wf1
```
Result:
```
🤖 State:
―――――――――
                                  
 Service  ImageProcessingWorkflow 
 Key      user123-wf1             

 KEY     VALUE                                                             
 status  {                                                                 
           "imgName": "c7879b2b-c213-f723-60c1-593422c98bc2",              
           "output": [                                                     
             "[Took screenshot of website with url: https://restate.dev]", 
             "[Rotated image with angle: 90]",                             
             "[Blurred image with strength param 5]"                       
           ],                                                              
           "status": "Finished"                                            
         }
```

### More complex workflows

Try more complex workflows, and have a look at the end result.

- Puppeteer screenshot -> blur -> rotate -> rotate -> rotate -> rotate:

```shell
curl localhost:8080/ImageProcessingWorkflow/user123-wf2/run -H 'content-type: application/json' \
  -d '[
        {"action":"puppeteer","parameters":{"url":"https://restate.dev"}},
        {"action":"blur","parameters":{"blur":5}}, 
        {"action":"rotate","parameters":{"angle":90}}, 
        {"action":"rotate","parameters":{"angle":90}}, 
        {"action":"rotate","parameters":{"angle":90}}, 
        {"action":"rotate","parameters":{"angle":90}}
      ]' 
```

- Invalid workflow definition (no image source is defined):

```shell
curl localhost:8080/ImageProcessingWorkflow/user123-wf3/run -H 'content-type: application/json' \
  -d '[
        {"action":"invalid","parameters":{"angle":90}},
        {"action":"blur","parameters":{"blur":5}}]}'
```