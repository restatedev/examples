#!/usr/bin/env bash

set -eufx -o pipefail

NEW_VERSION=$1
SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function bump_ts_sdk() {
    npm --prefix $1 install @restatedev/restate-sdk@^$NEW_VERSION
}

bump_ts_sdk $PROJECT_ROOT/basics

bump_ts_sdk $PROJECT_ROOT/typescript/templates/typescript
bump_ts_sdk $PROJECT_ROOT/typescript/templates/typescript-testing
bump_ts_sdk $PROJECT_ROOT/typescript/integrations/typescript-lambda-cdk
bump_ts_sdk $PROJECT_ROOT/typescript/templates/bun

# Cloudflare workers has a different module
npm --prefix $PROJECT_ROOT/typescript/templates/cloudflare-worker install @restatedev/restate-sdk-cloudflare-workers@^$NEW_VERSION

# deno bump - it doesn't use a package.json, only import strings
# -i works differently in gnu sed and mac (bsd) sed - best avoided
tmp=$(mktemp)
sed "s#\"npm:@restatedev/restate-sdk@^.*/fetch\"#\"npm:@restatedev/restate-sdk@^${NEW_VERSION}/fetch\"#g" $PROJECT_ROOT/templates/deno/main.ts > $tmp
mv $tmp $PROJECT_ROOT/typescript/templates/deno/main.ts

bump_ts_sdk $PROJECT_ROOT/tutorials/tour-of-restate-typescript

bump_ts_sdk $PROJECT_ROOT/typescript/patterns-use-cases

bump_ts_sdk $PROJECT_ROOT/typescript/end-to-end-applications/ai-image-workflows
bump_ts_sdk $PROJECT_ROOT/typescript/end-to-end-applications/food-ordering/app
bump_ts_sdk $PROJECT_ROOT/typescript/end-to-end-applications/chat-bot


function bump_ts_sdk_clients() {
    npm --prefix $1 install @restatedev/restate-sdk-clients@^$NEW_VERSION
}

bump_ts_sdk_clients $PROJECT_ROOT/basics
bump_ts_sdk_clients $PROJECT_ROOT/patterns-use-cases/durable-promises/durable-promises-typescript
bump_ts_sdk_clients $PROJECT_ROOT/typescript/end-to-end-applications/food-ordering/webui



function bump_ts_sdk_testing() {
    npm --prefix $1 install @restatedev/restate-sdk-testcontainers@^$NEW_VERSION
}

bump_ts_sdk_testing $PROJECT_ROOT/typescript/templates/typescript-testing