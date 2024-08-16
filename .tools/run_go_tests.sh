#!/usr/bin/env bash

SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function go_build_check() {
    pushd $1
    go build  -o /dev/null ./...
    go vet ./...
    popd
}

go_build_check $PROJECT_ROOT/templates/go
go_build_check $PROJECT_ROOT/tutorials/tour-of-restate-go
