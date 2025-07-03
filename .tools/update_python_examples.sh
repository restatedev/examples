#!/usr/bin/env bash

set -eufx -o pipefail

NEW_VERSION=$1
SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function search_and_replace_version() {
  echo "upgrading Python version of $1 to $NEW_VERSION"
  if [ -e "$1/requirements.txt" ]; then
    sed -i 's/restate_sdk==[0-9A-Za-z.-]*/restate_sdk=='"$NEW_VERSION"'/' "$1/requirements.txt"
  fi;
  if [ -e "$1/pyproject.toml" ]; then
    sed -i 's/restate-sdk==[0-9A-Za-z.-]*/restate-sdk=='"$NEW_VERSION"'/' "$1/pyproject.toml"
    sed -i 's/restate_sdk\[serde\]>=[0-9A-Za-z.-]*/restate_sdk[serde]>='"$NEW_VERSION"'/' "$1/pyproject.toml"
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
