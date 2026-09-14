#!/usr/bin/env bash

set -eufx -o pipefail

SDK_VERSION=${1:-}
TUNNEL_VERSION=${2:-}
SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function bump_go_sdk() {
    local project_dir=$1
    local modules=()
    if [[ -n "$SDK_VERSION" ]]; then
        modules+=("github.com/restatedev/sdk-go@v${SDK_VERSION#v}")
    fi
    if [[ -n "$TUNNEL_VERSION" ]] && grep -Eq '^[[:space:]]*(require[[:space:]]+)?github.com/restatedev/sdk-go/x/tunnel[[:space:]]' "$project_dir/go.mod"; then
        modules+=("github.com/restatedev/sdk-go/x/tunnel@v${TUNNEL_VERSION#v}")
    fi
    if [[ ${#modules[@]} -eq 0 ]]; then
        return
    fi

    pushd "$project_dir"
    go get "${modules[@]}"
    go mod tidy
    go test ./...


    # If this is a template directory and has existing agents documentation, update it
    if [[ -n "$SDK_VERSION" && "$project_dir" == *"/templates/"* ]] && [ -f "./.cursor/rules/AGENTS.md" ]; then
        echo "Updating agents documentation for template in $project_dir"
        wget -O "./.cursor/rules/AGENTS.md" https://docs.restate.dev/develop/go/agents.md
    fi
    if [[ -n "$SDK_VERSION" && "$project_dir" == *"/templates/"* ]] && [ -f "./.claude/CLAUDE.md" ]; then
        echo "Updating agents documentation for template in $project_dir"
        wget -O "./.claude/CLAUDE.md" https://docs.restate.dev/develop/go/agents.md
    fi

    popd
}

bump_go_sdk $PROJECT_ROOT/go/basics
bump_go_sdk $PROJECT_ROOT/go/templates/go
bump_go_sdk $PROJECT_ROOT/go/templates/go-kubernetes
bump_go_sdk $PROJECT_ROOT/go/integrations/knative-go
bump_go_sdk $PROJECT_ROOT/go/integrations/go-lambda-cdk/lambda
bump_go_sdk $PROJECT_ROOT/go/tutorials/tour-of-orchestration-go
bump_go_sdk $PROJECT_ROOT/go/tutorials/tour-of-workflows-go
bump_go_sdk $PROJECT_ROOT/go/patterns-use-cases
