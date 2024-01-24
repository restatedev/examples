import * as restate from "@restatedev/restate-sdk";

import {
  ExampleService,
  SampleRequest,
  SampleResponse,
} from "./generated/proto/example";

export class MyExampleService implements ExampleService {
  async sampleCall(request: SampleRequest): Promise<SampleResponse> {
    const ctx = restate.useContext(this);

    // Service business logic goes here

    return SampleResponse.create({ response: "Hello " + request.request });
  }
}
