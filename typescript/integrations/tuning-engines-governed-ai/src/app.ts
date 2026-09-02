import * as restate from "@restatedev/restate-sdk";

type Input = {
  prompt?: string;
  run_id?: string;
};

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID().replaceAll("-", "")}`;
}

async function callTuningEngines(input: {
  prompt: string;
  run_id: string;
  request_id: string;
}): Promise<unknown> {
  const key = process.env.TE_INFERENCE_KEY;
  if (!key) {
    throw new Error("Set TE_INFERENCE_KEY before invoking this service.");
  }

  const response = await fetch("https://api.tuningengines.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "X-TE-Run-ID": input.run_id,
      "X-TE-Request-ID": input.request_id,
    },
    body: JSON.stringify({
      model: process.env.TE_MODEL || "auto",
      messages: [{ role: "user", content: input.prompt }],
      metadata: {
        run_id: input.run_id,
        request_id: input.request_id,
        runtime: "restate",
        event_type: "model.call",
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Tuning Engines request failed: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

export default restate.service({
  name: "TuningEnginesService",
  handlers: {
    async governedAi(_ctx: restate.Context, input: Input) {
      const run_id = input.run_id || newId("restate");
      const request_id = newId("req");
      const prompt = input.prompt || "Say hello from a governed Restate handler.";

      const result = await callTuningEngines({ prompt, run_id, request_id });
      return { run_id, request_id, result };
    },
  },
});
