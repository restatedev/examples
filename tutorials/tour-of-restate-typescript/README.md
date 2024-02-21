# A Tour of Restate with TypeScript

Restate is a system for easily building resilient applications using **distributed durable RPC & async/await**.

This example contains the code for the `Tour of Restate` tutorial, for the Typescript Handler API.
This tutorial takes your through key Restate features by developing an end-to-end ticketing app.

❓ Learn more about Restate from the [Restate documentation](https://docs.restate.dev).

## Download the example

- Via the CLI:
    ```shell
    restate example typescript-tour-of-restate && cd typescript-tour-of-restate
    ```

- Via git clone:
    ```shell
    git clone git@github.com:restatedev/examples.git
    cd examples/typescript/tour-of-restate
    ```

- Via `wget`:
    ```shell
    wget https://github.com/restatedev/examples/releases/latest/download/typescript-tour-of-restate.zip && unzip typescript-tour-of-restatezip -d typescript-tour-of-restate && rm typescript-tour-of-restate.zip
    ```
## Running the example

Have a look at the [Tour of Restate tutorial](https://docs.restate.dev/tour) in the documentation to build and run the application in this repository.

In short, you can run the different parts of the code via:

```
npm install
npm run build
npm run app
npm run part1
npm run part2
npm run part3
npm run part4
```

An SDK upgrade warrants a new release.