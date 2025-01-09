#!/usr/bin/env bash

set -eufx -o pipefail

SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function bun_install_check() {
    pushd $1
    bun install
    bun run build
    popd
}

function deno_install_check() {
    pushd $1
    deno task build
    popd
}

function wrangler_install_check() {
    pushd $1
    npm install
    npm run build
    npx wrangler deploy --dry-run --outdir dist
    popd
}

wrangler_install_check $PROJECT_ROOT/typescript/templates/cloudflare-worker
bun_install_check $PROJECT_ROOT/typescript/templates/bun
deno_install_check $PROJECT_ROOT/typescript/templates/deno
