#!/usr/bin/env bash

set -eufx -o pipefail

SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function python_mypi_lint() {
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -r requirements.txt
  pip install mypy
  python3 -m mypy .
  deactivate
}

pushd $PROJECT_ROOT/templates/python && python_mypi_lint && popd || exit
pushd $PROJECT_ROOT/patterns-use-cases/ticket-reservation/ticket-reservation-python && python_mypi_lint && popd || exit