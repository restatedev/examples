#!/usr/bin/env bash

set -eufx -o pipefail

SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function npm_install_check() {
    npm install --prefix $1 && npm --prefix $1 run build
}

npm_install_check $PROJECT_ROOT/basics/basics-typescript

npm_install_check $PROJECT_ROOT/templates/typescript
RESTATE_ENV_ID=env_test RESTATE_API_KEY=key_test npm_install_check $PROJECT_ROOT/templates/typescript-lambda-cdk
npm_install_check $PROJECT_ROOT/templates/cloudflare-worker

npm_install_check $PROJECT_ROOT/templates/typescript-testing
npm --prefix $PROJECT_ROOT/templates/typescript-testing run test

npm_install_check $PROJECT_ROOT/tutorials/tour-of-restate-typescript

npm_install_check $PROJECT_ROOT/patterns-use-cases/async-signals-payment/async-signals-payment-typescript
npm_install_check $PROJECT_ROOT/patterns-use-cases/durable-promises/durable-promises-typescript
npm_install_check $PROJECT_ROOT/patterns-use-cases/payment-state-machine/payment-state-machine-typescript
npm_install_check $PROJECT_ROOT/patterns-use-cases/sagas/sagas-typescript
npm_install_check $PROJECT_ROOT/patterns-use-cases/state-machines/state-machines-typescript

npm_install_check $PROJECT_ROOT/end-to-end-applications/typescript/ai-image-workflows
npm_install_check $PROJECT_ROOT/end-to-end-applications/typescript/food-ordering/app
npm_install_check $PROJECT_ROOT/end-to-end-applications/typescript/chat-bot
