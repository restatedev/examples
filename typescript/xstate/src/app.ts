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

import {createMachine, sendTo} from 'xstate';
import {bindXStateRouter} from "./lib";
import {fromPromise} from "./promise";

const authServerMachine = createMachine({
  id: 'server',
  initial: 'waitingForCode',
  states: {
    waitingForCode: {
      on: {
        CODE: {
          target: "process"
        },
      },
    },
    process: {
      invoke: {
        id: 'process',
        src: 'authorise',
        onDone: {
          actions: sendTo(
            ({self}) => self._parent!,
            { type: 'TOKEN' },
            { delay: 1000 },
          ),
        },
      }
    },
  }
}, {
  actors: {
    authorise: fromPromise(() => new Promise((resolve) => setTimeout(resolve, 5000))),
  }
});

const authClientMachine = createMachine({
  id: 'client',
  initial: 'idle',
  states: {
    idle: {
      on: {
        AUTH: {target: 'authorizing'},
      },
    },
    authorizing: {
      invoke: {
        id: 'auth-server',
        src: authServerMachine,
      },
      entry: sendTo('auth-server', ({self}) => ({
        type: 'CODE',
        sender: self,
      })),
      on: {
        TOKEN: {target: 'authorized'},
      },
    },
    authorized: {
      type: 'final',
    },
  },
});


bindXStateRouter(restate.createServer(), "foo", authClientMachine).listen()

