#!/usr/bin/env bash

set -eufx -o pipefail

NEW_VERSION=$1
SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function bump_restate_sdk_deps() {
    local project_dir=$1
    local package_json="$project_dir/package.json"

    # Check if package.json exists
    if [ ! -f "$package_json" ]; then
        echo "No package.json found in $project_dir"
        return
    fi

    # Extract dependencies that start with @restatedev/restate-sdk
    local deps=$(node -e "
        const fs = require('fs');
        const pkg = JSON.parse(fs.readFileSync('$package_json', 'utf8'));
        const deps = pkg.dependencies || {};
        const restateDeps = Object.keys(deps).filter(dep => dep.startsWith('@restatedev/restate-sdk'));
        console.log(restateDeps.join(' '));
    ")

    # Install each dependency with the new version
    for dep in $deps; do
        echo "Installing $dep@^$NEW_VERSION in $project_dir"
        npm --prefix $project_dir install $dep@^$NEW_VERSION
    done
}

# Update all projects with package.json
bump_restate_sdk_deps $PROJECT_ROOT/typescript/basics
bump_restate_sdk_deps $PROJECT_ROOT/typescript/templates/node
bump_restate_sdk_deps $PROJECT_ROOT/typescript/templates/typescript-testing
bump_restate_sdk_deps $PROJECT_ROOT/typescript/integrations/deployment-lambda-cdk
bump_restate_sdk_deps $PROJECT_ROOT/typescript/templates/bun
bump_restate_sdk_deps $PROJECT_ROOT/typescript/templates/nextjs
bump_restate_sdk_deps $PROJECT_ROOT/typescript/templates/cloudflare-worker
bump_restate_sdk_deps $PROJECT_ROOT/typescript/tutorials/tour-of-restate-typescript
bump_restate_sdk_deps $PROJECT_ROOT/typescript/patterns-use-cases
bump_restate_sdk_deps $PROJECT_ROOT/typescript/end-to-end-applications/ai-image-workflows
bump_restate_sdk_deps $PROJECT_ROOT/typescript/end-to-end-applications/food-ordering/app
bump_restate_sdk_deps $PROJECT_ROOT/typescript/end-to-end-applications/food-ordering/webui
bump_restate_sdk_deps $PROJECT_ROOT/typescript/end-to-end-applications/chat-bot

# deno bump - it doesn't use a package.json, only import strings
# -i works differently in gnu sed and mac (bsd) sed - best avoided
tmp=$(mktemp)
sed "s#\"npm:@restatedev/restate-sdk@^.*/fetch\"#\"npm:@restatedev/restate-sdk@^${NEW_VERSION}/fetch\"#g" $PROJECT_ROOT/typescript/templates/deno/main.ts > $tmp
mv $tmp $PROJECT_ROOT/typescript/templates/deno/main.ts
