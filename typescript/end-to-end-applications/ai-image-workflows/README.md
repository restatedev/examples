# AI Image Workflow Parser & Executor

This example implements a workflow that executes various AI image processing steps,
like image generation and transformations.

The workflow is specified dynamically in a json-based workflow definition.
The workflow can contain steps that call different image processing services:
- to generate images by taking a screenshot with Puppeteer or by using Stable Diffusion (with prompt specification)
- to transform images based on a prompt with Stable Diffusion
- to rotate images
- to blur images


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
    |                          |    |  | StableDiffusion |   |
    |                          |    |  | (/generate)     |   |
    |                          |    |  +-----------------+   |
    |                          |    |  | StableDiffusion |   |
    |                          |    |  | (/transform)    |   |
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

- **CLI:** `restate example typescript-ai-image-workflows`

- **Zip archive:** https://github.com/restatedev/examples/releases/latest/download/typescript-ai-image-workflows.zip

## Running the example

1. Install the dependencies: `npm install`.

2. Start Restate Server in a separate shell: `npx restate-server`

3. Start the workflow and image transformation services: `npm run app-dev`

4. Register the example at Restate server by calling
   `npx restate -y deployment register "localhost:9080"`.

## Demo scenario

Here is list of example workflow execution requests that you can send to the workflow executor:

### Example workflow
Puppeteer screenshot -> rotate -> blur:

```shell
curl localhost:8080/image-processing-workflow/user123-wf1/run -H 'content-type: application/json' \
  -d '[
          {"action":"puppeteer","parameters":{"url":"https://restate.dev"}},
          {"action":"rotate","parameters":{"angle":90}},
          {"action":"blur","parameters":{"blur":5}}
       ]'
```

Have a look at the `generated-images` folder to see the end result.

### Retrieving state
You can retrieve the workflow state via the `getStatus` handler or via the CLI.
For example for id `user123-wf1`, do:

```shell
curl localhost:8080/image-processing-workflow/user123-wf1/getStatus
```
Result:
```
{
  "status": "Finished",
  "imgName": "70ba2af9-a5d7-4790-9647-d324d6322d6f",
  "output": [
    {
      "msg": "[Took screenshot of website with url: https://restate.dev]"
    },
    {
      "msg": "[Rotated image with angle: 90]"
    },
    {
      "msg": "[Blurred image with strength param 5]"
    }
  ]
}
```


or with the CLI

```shell
npx restate kv get image-processing-workflow user123-wf1
```
```shell
🤖 State:
―――――――――
                                    
 Service  image-processing-workflow 
 Key      user123-wf18              

 KEY     VALUE                                                               
 status  {                                                                   
           "imgName": "d587b7dd-915e-4a02-8be5-2a6db9833796",                
           "output": [                                                       
             {                                                               
         "msg": "[Took screenshot of website with url: https://restate.dev]" 
             },                                                              
             {                                                               
               "msg": "[Rotated image with angle: 90]"                       
             },                                                              
             {                                                               
               "msg": "[Blurred image with strength param 5]"                
             }                                                               
           ],                                                                
           "status": "Finished"                                              
         }  
```

### More complex workflows

Try more complex workflows, and have a look at the end result.

- Puppeteer screenshot -> blur -> rotate -> rotate -> rotate -> rotate:

```shell
curl localhost:8080/image-processing-workflow/user123-wf2/run -H 'content-type: application/json' \
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
curl localhost:8080/image-processing-workflow/user123-wf2/run -H 'content-type: application/json' -d '[{"action":"invalid","parameters":{"angle":90}},{"action":"blur","parameters":{"blur":5}}]}'
```


### OPTIONAL: With Stable Diffusion

[Stable Diffusion](https://github.com/CompVis/stable-diffusion) is a text-to-image model that can generate and transform images based on a prompt.
We can add a workflow step that invokes the Stable Diffusion service to generate images and then transform them based on a prompt.

Install stable diffusion:

```shell
mkdir stable-diffusion
cd stable-diffusion
```

Follow the steps here:
https://github.com/AUTOMATIC1111/stable-diffusion-webui?tab=readme-ov-file#installation-and-running

It may take some time to install.

Run it with:

```shell
cd stable-diffusion/stable-diffusion-webui
./webui.sh --api
```

For Linux installations, you may have to use the following options, in case you encounter errors:
`export COMMANDLINE_ARGS="--skip-torch-cuda-test --precision full --no-half"`


Stable diffusion generation (15 steps) -> rotate -> blur:

```shell
curl localhost:8080/image-processing-workflow/user234-wf1/run -H 'content-type: application/json' -d '[{"action":"stable-diffusion-generator","parameters":{"prompt":"A sunny beach", "steps":15}},{"action":"rotate","parameters":{"angle":90}},{"action":"blur","parameters":{"blur":5}}]'
```

Stable diffusion generation (1 step) -> stable diffusion transformation (1 step) -> rotate -> blur:

```shell
curl localhost:8080/image-processing-workflow/user234-wf2run -H 'content-type: application/json' -d '[{"action":"stable-diffusion-generator","parameters":{"prompt":"A sunny beach", "steps":1}},{"action":"stable-diffusion-transformer","parameters":{"prompt":"Make it snow on this sunny beach image", "steps":1}},{"action":"rotate","parameters":{"angle":90}},{"action":"blur","parameters":{"blur":5}}]'
```

Stable diffusion generation (15 steps) -> stable diffusion transformation (15 steps) -> rotate -> blur:

```shell
curl localhost:8080/image-processing-workflow/user234-wf3/run -H 'content-type: application/json' -d '[{"action":"stable-diffusion-generator","parameters":{"prompt":"A sunny beach", "steps":15}},{"action":"stable-diffusion-transformer","parameters":{"prompt":"Make it snow on this sunny beach image", "steps":15}},{"action":"rotate","parameters":{"angle":90}},{"action":"blur","parameters":{"blur":5}}]'
```

Puppeteer screenshot -> stable diffusion -> rotate -> blur:

```shell
curl localhost:8080/image-processing-workflow/user123-wf5/run -H 'content-type: application/json' -d '[{"action":"puppeteer","parameters":{"url":"https://restate.dev"}},{"action":"stable-diffusion-transformer","parameters":{"prompt":"Change the colors to black background and pink font", "steps":25}},{"action":"rotate","parameters":{"angle":90}},{"action":"blur","parameters":{"blur":5}}]'
```

