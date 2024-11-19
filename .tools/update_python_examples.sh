#!/usr/bin/env bash

set -eufx -o pipefail

NEW_VERSION=$1
SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function search_and_replace_version() {
  echo "upgrading Python version of $1 to $NEW_VERSION"
  sed -i 's/restate_sdk==[0-9A-Za-z.-]*/restate_sdk=='"$NEW_VERSION"'/' "$1/requirements.txt"
}

search_and_replace_version $PROJECT_ROOT/templates/python
search_and_replace_version $PROJECT_ROOT/tutorials/tour-of-restate-python
search_and_replace_version $PROJECT_ROOT/end-to-end-applications/python/food-ordering/app
