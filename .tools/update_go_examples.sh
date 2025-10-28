#!/usr/bin/env bash

set -eufx -o pipefail

NEW_VERSION=v$1
SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function bump_go_sdk() {
    pushd $1
    go get github.com/restatedev/sdk-go@$NEW_VERSION
    go mod tidy
    popd
}

bump_go_sdk $PROJECT_ROOT/go/basics
bump_go_sdk $PROJECT_ROOT/go/templates/go
bump_go_sdk $PROJECT_ROOT/go/integrations/knative-go
bump_go_sdk $PROJECT_ROOT/go/integrations/go-lambda-cdk/lambda
bump_go_sdk $PROJECT_ROOT/go/tutorials/tour-of-orchestration-go
bump_go_sdk $PROJECT_ROOT/go/tutorials/tour-of-workflows-go
bump_go_sdk $PROJECT_ROOT/go/patterns-use-cases
