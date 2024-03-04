#!/usr/bin/env bash

NEW_VERSION=$1
SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function bump_ts_sdk() {
    npm --prefix $1 install @restatedev/restate-sdk@^$NEW_VERSION
}

bump_ts_sdk $PROJECT_ROOT/basics/basics-typescript

bump_ts_sdk $PROJECT_ROOT/templates/typescript

bump_ts_sdk $PROJECT_ROOT/tutorials/tour-of-restate-typescript

bump_ts_sdk $PROJECT_ROOT/patterns-use-cases/async-signals-payment/async-signals-payment-typescript
bump_ts_sdk $PROJECT_ROOT/patterns-use-cases/durable-promises/durable-promises-typescript
bump_ts_sdk $PROJECT_ROOT/patterns-use-cases/payment-state-machine/payment-state-machine-typescript
bump_ts_sdk $PROJECT_ROOT/patterns-use-cases/sagas/sagas-typescript
bump_ts_sdk $PROJECT_ROOT/patterns-use-cases/state-machines/state-machines-typescript
bump_ts_sdk $PROJECT_ROOT/patterns-use-cases/ticket-reservation/ticket-reservation-typescript

bump_ts_sdk $PROJECT_ROOT/end-to-end-applications/typescript/ai-image-workflows
bump_ts_sdk $PROJECT_ROOT/end-to-end-applications/typescript/ecommerce-store/services
bump_ts_sdk $PROJECT_ROOT/end-to-end-applications/typescript/food-ordering/app
