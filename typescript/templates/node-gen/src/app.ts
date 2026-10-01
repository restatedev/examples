import * as restate from "@restatedev/restate-sdk";
import { run, service, type Operation } from "@restatedev/restate-sdk-gen";

const greeter = service({
  name: "Greeter",
  handlers: {
    *greet(name: string): Operation<string> {
      return yield* run(async () => `Hello ${name}!`);
    },
  },
});

restate.serve({ services: [greeter] });
