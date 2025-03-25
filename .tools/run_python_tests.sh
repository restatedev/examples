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

pushd $PROJECT_ROOT/python/templates/python && python_mypi_lint && popd
pushd $PROJECT_ROOT/python/basics && python_mypi_lint && popd
pushd $PROJECT_ROOT/python/patterns-use-cases && python_mypi_lint && popd
pushd $PROJECT_ROOT/python/tutorials/tour-of-restate-python && python_mypi_lint && popd
pushd $PROJECT_ROOT/python/end-to-end-applications/chat-bot/chatbot && python_mypi_lint && popd
pushd $PROJECT_ROOT/python/end-to-end-applications/rag-ingestion && python_mypi_lint && popd
pushd $PROJECT_ROOT/python/end-to-end-applications/food-ordering/app && python_mypi_lint && popd
