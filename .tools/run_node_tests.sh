#!/usr/bin/env bash

set -eufx -o pipefail

SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function npm_install_check() {
    npm install --prefix $1 && npm --prefix $1 run build
}

npm_install_check $PROJECT_ROOT/typescript/basics

npm_install_check $PROJECT_ROOT/typescript/templates/node
RESTATE_ENV_ID=env_test RESTATE_API_KEY=key_test npm_install_check $PROJECT_ROOT/typescript/integrations/deployment-lambda-cdk
npm_install_check $PROJECT_ROOT/typescript/templates/cloudflare-worker

npm_install_check $PROJECT_ROOT/typescript/templates/typescript-testing
npm --prefix $PROJECT_ROOT/typescript/templates/typescript-testing run test

npm_install_check $PROJECT_ROOT/typescript/tutorials/tour-of-restate-typescript

npm_install_check $PROJECT_ROOT/typescript/patterns-use-cases

npm_install_check $PROJECT_ROOT/typescript/end-to-end-applications/ai-image-workflows
npm_install_check $PROJECT_ROOT/typescript/end-to-end-applications/food-ordering/app
npm_install_check $PROJECT_ROOT/typescript/end-to-end-applications/chat-bot
