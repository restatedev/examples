#!/usr/bin/env bash

SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function cargo_build_check() {
    pushd $1
    cargo clippy
    popd
}

cargo_build_check $PROJECT_ROOT/rust/templates/rust
cargo_build_check $PROJECT_ROOT/rust/templates/rust-shuttle
cargo_build_check $PROJECT_ROOT/rust/tutorials/tour-of-restate-rust