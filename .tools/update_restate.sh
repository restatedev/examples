#!/usr/bin/env bash

NEW_VERSION=$1
SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function bump_npm_restate() {
    npm --prefix $1 install @restatedev/restate@^$NEW_VERSION
}

function bump_npm_restate_cli() {
    npm --prefix $1 install @restatedev/restate-server@^$NEW_VERSION
}

bump_npm_restate $PROJECT_ROOT/basics/basics-typescript
bump_npm_restate_cli $PROJECT_ROOT/basics/basics-typescript

bump_npm_restate $PROJECT_ROOT/patterns-use-cases/async-signals-payment/async-signals-payment-typescript
bump_npm_restate_cli $PROJECT_ROOT/patterns-use-cases/async-signals-payment/async-signals-payment-typescript

bump_npm_restate $PROJECT_ROOT/patterns-use-cases/durable-promises/durable-promises-typescript
bump_npm_restate_cli $PROJECT_ROOT/patterns-use-cases/durable-promises/durable-promises-typescript

bump_npm_restate $PROJECT_ROOT/patterns-use-cases/state-machines/state-machines-typescript
bump_npm_restate_cli $PROJECT_ROOT/patterns-use-cases/state-machines/state-machines-typescript