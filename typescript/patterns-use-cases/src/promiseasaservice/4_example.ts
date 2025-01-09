
import * as restate from "@restatedev/restate-sdk";
import { durablePromise } from "./dp/clients";

restate.service({
  name: "qna",
  handlers: {
    /**
     * Wait for someone will answer a question with a given id.
     */
    async ask(ctx: restate.Context, questionId: string) {
      const dp = durablePromise<string>(questionId, ctx);
      const answer = await dp.get();
      return {
        answer,
      };
    },

    /**
     * Answer a question 
     */
    async answer(
      ctx: restate.Context,
      answer: { questionId: string; answer: string }
    ) {
      const dp = durablePromise<string>(answer.questionId, ctx);
      await dp.resolve(answer.answer);
    },
  },
});