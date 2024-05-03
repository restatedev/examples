#!/usr/bin/env bash

NEW_VERSION=$1
SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function bump_cdk() {
    npm --prefix $1 install @restatedev/restate-cdk@$NEW_VERSION
}

bump_cdk $PROJECT_ROOT/templates/kotlin-gradle-lambda-cdk
bump_cdk $PROJECT_ROOT/templates/typescript-lambda-cdk
