import {
  type Serde,
  type Context,
  type RunOptions,
  TerminalError,
} from "@restatedev/restate-sdk";
import type {
  LanguageModelV2,
  LanguageModelV2Middleware,
} from "@ai-sdk/provider";

import superjson from "superjson";
import {
  type StepResult,
  type StopCondition,
  type ToolModelMessage,
  type TypedToolError,
} from "ai";

export type DoGenerateResponseType = Awaited<
  ReturnType<LanguageModelV2["doGenerate"]>
>;

export class SuperJsonSerde<T> implements Serde<T> {
  contentType = "application/json";

  serialize(value: T): Uint8Array {
    const js = superjson.stringify(value);
    return new TextEncoder().encode(js);
  }

  deserialize(data: Uint8Array): T {
    const js = new TextDecoder().decode(data);
    return superjson.parse(js) as T;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const superJson = new SuperJsonSerde<any>();

/**
 * The following function is a middleware that provides durability to the results of a
 * `doGenerate` method of a LanguageModelV1 instance.
 * @param ctx the restate context used to capture the execution of the `doGenerate` method.
 * @param opts retry options for the `doGenerate` method.
 * @returns an LanguageModelV2Middleware that provides durability to the underlying model.
 */
export const durableCalls = (
  ctx: Context,
  opts?: RunOptions<DoGenerateResponseType>,
): LanguageModelV2Middleware => {
  const runOpts = {
    serde: new SuperJsonSerde<DoGenerateResponseType>(),
    ...opts,
  };

  return {
    wrapGenerate: async ({ model, doGenerate }) =>
      ctx.run(`calling ${model.provider}`, async () => doGenerate(), runOpts),
  };
};

const getFirstTerminalToolErrorForStep = (step: StepResult<any>) =>
  step.content.find(
    (el) => el.type === "tool-error" && el.error instanceof TerminalError,
  ) as TypedToolError<any> | undefined;

export const getTerminalToolSteps = (steps: StepResult<any>[]) =>
  steps.filter((step) => getFirstTerminalToolErrorForStep(step) != undefined);

export const hasTerminalToolError: StopCondition<any> = ({ steps }) =>
  steps.some((step) => getFirstTerminalToolErrorForStep(step) !== undefined);

export const rethrowTerminalToolError = (step: StepResult<any>) => {
  const terminalStep = getFirstTerminalToolErrorForStep(step);
  if (!terminalStep) {
    return;
  }
  // Find the tool message corresponding to the terminal error
  const toolMessage = step.response.messages.find(
    (msg) =>
      msg.role === "tool" &&
      msg.content.some((c) => c.toolCallId === terminalStep.toolCallId),
  ) as ToolModelMessage;
  const errorText =
    toolMessage?.content
      .find(
        (content) =>
          content.toolCallId === terminalStep.toolCallId &&
          content.type === "tool-result",
      )
      ?.output?.value?.toString() ||
    `Terminal error for tool call ${terminalStep.toolName}.`;
  // Rethrow the terminal error with the extracted message
  throw new TerminalError(errorText);
};
