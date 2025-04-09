#!/usr/bin/env bash

set -eufx -o pipefail

NEW_VERSION=$1
SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function bump_rust_sdk() {
    pushd $1
    # This is using https://github.com/killercup/cargo-edit
    cargo upgrade -p restate-sdk@$NEW_VERSION
    popd
}

bump_rust_sdk $PROJECT_ROOT/rust/basics
bump_rust_sdk $PROJECT_ROOT/rust/templates/rust
bump_rust_sdk $PROJECT_ROOT/rust/templates/rust-shuttle
bump_rust_sdk $PROJECT_ROOT/rust/tutorials/tour-of-restate-rust
