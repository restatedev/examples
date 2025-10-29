#!/usr/bin/env bash

set -eufx -o pipefail

NEW_VERSION=$1
SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function search_and_replace_version() {
  pushd $1
  echo "upgrading Python version of $1 to $NEW_VERSION"
  if [ -e "pyproject.toml" ]; then
    # Use uv for pyproject.toml projects
    uv add "restate-sdk[serde]>=$NEW_VERSION"
  elif [ -e "requirements.txt" ]; then
    sed -i 's/restate[_-]sdk\[serde\][>=!<~][^[:space:]]*/restate-sdk[serde]=='$NEW_VERSION'/' requirements.txt
  else
    echo "No pyproject.toml or requirements.txt found in $(pwd)"
    exit 1
  fi
  popd

  local project_dir=$1
  # If this is a template directory and has existing agents documentation, update it
  if [[ "$project_dir" == *"/templates/"* ]] && [ -f "$project_dir/.cursor/rules/AGENTS.md" ]; then
      echo "Updating agents documentation for template in $project_dir"
      wget -O "$project_dir/.cursor/rules/AGENTS.md" https://docs.restate.dev/develop/python/agents.md
  fi
  if [[ "$project_dir" == *"/templates/"* ]] && [ -f "$project_dir/.claude/CLAUDE.md" ]; then
      echo "Updating agents documentation for template in $project_dir"
      wget -O "$project_dir/.claude/CLAUDE.md" https://docs.restate.dev/develop/python/agents.md
  fi
}

search_and_replace_version $PROJECT_ROOT/python/templates/python
search_and_replace_version $PROJECT_ROOT/python/templates/lambda
search_and_replace_version $PROJECT_ROOT/python/basics
search_and_replace_version $PROJECT_ROOT/python/patterns-use-cases
search_and_replace_version $PROJECT_ROOT/python/tutorials/tour-of-orchestration-python
search_and_replace_version $PROJECT_ROOT/python/tutorials/tour-of-workflows-python
search_and_replace_version $PROJECT_ROOT/python/integrations/deployment-lambda-cdk/lib/lambda
search_and_replace_version $PROJECT_ROOT/python/end-to-end-applications/chat-bot/backend
search_and_replace_version $PROJECT_ROOT/python/end-to-end-applications/rag-ingestion
search_and_replace_version $PROJECT_ROOT/python/end-to-end-applications/food-ordering/app
