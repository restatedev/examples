/*
 * Copyright (c) 2023-2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate SDK for Node.js/TypeScript,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in file LICENSE in the root
 * directory of this repository or package, or at
 * https://github.com/restatedev/sdk-typescript/blob/main/LICENSE
 */

import * as restate from "@restatedev/restate-sdk";
import { PromiseName, PromiseResult, RejectPromise, ResolvePromise, durablePromiseServer, protoMetadata } from "./generated/proto/promise_server";
import { Empty } from "./generated/proto/google/protobuf/empty";
import { durablePromiseObject, durablePromisesApi } from "./durable_promises";

const EMPTY = Empty.create({});

export class DurablePromisesServer implements durablePromiseServer {

    public resolve(request: ResolvePromise): Promise<PromiseResult> {
        const name = ensureName(request.promiseName);
        const ctx = restate.useContext(this);

        const resultPromise = ctx.rpcGateway()
            .rpc(durablePromisesApi)
            .resolve(name, request.value);
        return mapResult(name, resultPromise);
    }

    public reject(request: RejectPromise): Promise<PromiseResult> {
        const name = ensureName(request.promiseName);
        const message = ensureErrorMessage(request.errorMessage);
        const ctx = restate.useContext(this);

        const resultPromise = ctx.rpcGateway()
            .rpc(durablePromisesApi)
            .reject(name, message);
        return mapResult(name, resultPromise);
    }

    public peek(request: PromiseName): Promise<PromiseResult> {
        const name = ensureName(request.promiseName);
        const ctx = restate.useContext(this);

        const promise = ctx.rpcGateway()
            .rpc(durablePromisesApi)
            .peek(name);
        return mapResult(name, promise);
    }

    public async await(request: PromiseName): Promise<PromiseResult> {
        const name = ensureName(request.promiseName);
        const ctx = restate.useContext(this);

        const awakeable = ctx.awakeable();

        await ctx.rpcGateway()
            .rpc(durablePromisesApi)
            .await(name, awakeable.id);

        return mapResult(name, awakeable.promise);
    }

    public async dispose(request: PromiseName): Promise<Empty> {
        const name = ensureName(request.promiseName);
        const ctx = restate.useContext(this);

        await ctx.rpcGateway()
            .rpc(durablePromisesApi)
            .dispose(name);
        return EMPTY;
    }
}

restate
  .createServer()
  .bindKeyedRouter(durablePromisesApi.path, durablePromiseObject)
  .bindService({
    instance: new DurablePromisesServer(),
    service: "durablePromiseServer",
    descriptor: protoMetadata
  })
  .listen(9080);


function ensureName(promiseName: string | undefined) : string {
    if (promiseName === undefined) {
        throw new restate.TerminalError("promise name is undefined");
    }
    return promiseName;
}

function ensureErrorMessage(message: string | undefined) : string {
    if (message === undefined) {
        throw new restate.TerminalError("error message is undefined");
    }
    return message;
}

function mapResult(name: string, result: Promise<unknown>): Promise<PromiseResult> {
    return result.then(
        (value) => PromiseResult.create({
            promiseName: name,
            completed: value !== null,
            value: value === null ? undefined : value
        }),
        (reason) => PromiseResult.create({
            promiseName: name,
            completed: true,
            errorMessage: reason.message
        })
    );
}