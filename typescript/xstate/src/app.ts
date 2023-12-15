/*
 * Copyright (c) 2023 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples for the Node.js/TypeScript SDK,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

import * as restate from "@restatedev/restate-sdk";

import {createMachine} from 'xstate';
import {bindXStateRouter} from "./lib";
import {fromPromise} from "./promise";

export const workflow = createMachine(
  {
    id: 'async-function-invocation',
    initial: 'Send email',
    types: {} as {
      context: {
        customer: string;
      };
      input: {
        customer: string;
      };
    },
    context: ({input}) => ({
      customer: input.customer
    }),
    states: {
      'Send email': {
        invoke: {
          src: 'sendEmail',
          input: ({context}) => ({
            customer: context.customer
          }),
          onDone: 'Email sent'
        }
      },
      'Email sent': {
        type: 'final'
      }
    }
  },
  {
    actors: {
      sendEmail: fromPromise(async ({ input }) => {
        console.log('Sending email to', input.customer);

        await new Promise<void>((resolve) =>
          setTimeout(() => {
            console.log('Email sent to', input.customer);
            resolve();
          }, 1000)
        );
      })
    }
  }
);


bindXStateRouter(restate.createServer(), "foo", workflow).listen()

