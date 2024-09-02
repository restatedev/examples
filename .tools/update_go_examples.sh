#!/usr/bin/env bash

NEW_VERSION=$1
SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function bump_go_sdk() {
    pushd $1
    go get github.com/restatedev/sdk-go@$NEW_VERSION
    go mod tidy
    popd
}

bump_go_sdk $PROJECT_ROOT/templates/go
bump_go_sdk $PROJECT_ROOT/tutorials/knative-go
bump_go_sdk $PROJECT_ROOT/tutorials/tour-of-restate-go
