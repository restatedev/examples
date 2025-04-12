#!/usr/bin/env bash

set -eufx -o pipefail

SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function go_build_check() {
    pushd $1
    go build  -o /dev/null ./...
    go vet ./...
    popd
}

go_build_check $PROJECT_ROOT/go/templates/go
go_build_check $PROJECT_ROOT/go/integrations/knative-go
go_build_check $PROJECT_ROOT/go/tutorials/tour-of-restate-go
