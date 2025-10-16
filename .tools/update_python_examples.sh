#!/usr/bin/env bash

set -eufx -o pipefail

NEW_VERSION=$1
SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function search_and_replace_version() {
  echo "upgrading Python version of $1 to $NEW_VERSION"
  if [ -e "pyproject.toml" ]; then
    # Use uv for pyproject.toml projects
    uv add "restate-sdk[serde]>=$NEW_VERSION"
  elif [ -e "requirements.txt" ]; then
    sed -i 's/restate[_-]sdk\[serde\][>=!<~][^[:space:]]*/restate-sdk[serde]=='$NEW_VERSION'/' requirements.txt
  fi;
}

search_and_replace_version $PROJECT_ROOT/python/templates/python
search_and_replace_version $PROJECT_ROOT/python/basics
search_and_replace_version $PROJECT_ROOT/python/patterns-use-cases
search_and_replace_version $PROJECT_ROOT/python/tutorials/tour-of-restate-python
search_and_replace_version $PROJECT_ROOT/python/integrations/deployment-lambda-cdk/lib/lambda
search_and_replace_version $PROJECT_ROOT/python/end-to-end-applications/chat-bot/backend
search_and_replace_version $PROJECT_ROOT/python/end-to-end-applications/rag-ingestion
search_and_replace_version $PROJECT_ROOT/python/end-to-end-applications/food-ordering/app
