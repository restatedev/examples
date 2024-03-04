#!/usr/bin/env bash

NEW_VERSION=$1
SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function search_and_replace_version() {
  sed -i 's/val restateVersion = "[0-9A-Z.-]*"/val restateVersion = "$NEW_VERSION"/' $1/build.gradle.kts
}

search_and_replace_version $PROJECT_ROOT/templates/java-gradle
search_and_replace_version $PROJECT_ROOT/templates/kotlin-gradle
search_and_replace_version $PROJECT_ROOT/templates/scala-sbt

search_and_replace_version $PROJECT_ROOT/patterns-use-cases/sagas/sagas-java

search_and_replace_version $PROJECT_ROOT/tutorials/tour-of-restate-java

search_and_replace_version $PROJECT_ROOT/end-to-end-applications/java/food-ordering/app