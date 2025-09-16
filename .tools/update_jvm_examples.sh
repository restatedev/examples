#!/usr/bin/env bash

set -eufx -o pipefail

NEW_VERSION=$1
SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function search_and_replace_version_gradle() {
  sed -i 's/val restateVersion = "[0-9A-Z.-]*"/val restateVersion = "'$NEW_VERSION'"/' $1/build.gradle.kts
}

function search_and_replace_version_maven() {
  pushd $1 && mvn -B versions:set-property -Dproperty=restate.version -DnewVersion=$NEW_VERSION && popd || exit
}

search_and_replace_version_gradle $PROJECT_ROOT/java/templates/java-gradle
search_and_replace_version_maven $PROJECT_ROOT/java/templates/java-maven
search_and_replace_version_maven $PROJECT_ROOT/java/templates/java-maven-quarkus
search_and_replace_version_maven $PROJECT_ROOT/java/templates/java-maven-spring-boot
search_and_replace_version_gradle $PROJECT_ROOT/kotlin/templates/kotlin-gradle
search_and_replace_version_gradle $PROJECT_ROOT/kotlin/templates/kotlin-gradle-spring-boot

search_and_replace_version_gradle $PROJECT_ROOT/java/integrations/java-spring
search_and_replace_version_gradle $PROJECT_ROOT/java/integrations/java-gradle-lambda-cdk/lambda
search_and_replace_version_gradle $PROJECT_ROOT/kotlin/integrations/kotlin-gradle-lambda-cdk/lambda

search_and_replace_version_gradle $PROJECT_ROOT/java/basics
search_and_replace_version_gradle $PROJECT_ROOT/kotlin/basics

search_and_replace_version_gradle $PROJECT_ROOT/java/patterns-use-cases
search_and_replace_version_gradle $PROJECT_ROOT/kotlin/patterns-use-cases

search_and_replace_version_gradle $PROJECT_ROOT/java/tutorials/tour-of-restate-java
search_and_replace_version_gradle $PROJECT_ROOT/java/tutorials/tour-of-orchestration-java
search_and_replace_version_gradle $PROJECT_ROOT/java/tutorials/tour-of-workflows-java

search_and_replace_version_gradle $PROJECT_ROOT/java/end-to-end-applications/subway-fare-calculator
search_and_replace_version_gradle $PROJECT_ROOT/java/end-to-end-applications/food-ordering/app/restate-app
search_and_replace_version_gradle $PROJECT_ROOT/java/end-to-end-applications/food-ordering/app/restaurant
search_and_replace_version_maven $PROJECT_ROOT/java/end-to-end-applications/workflow-interpreter
search_and_replace_version_gradle $PROJECT_ROOT/kotlin/end-to-end-applications/food-ordering/app/restate-app
search_and_replace_version_gradle $PROJECT_ROOT/kotlin/end-to-end-applications/food-ordering/app/restaurant
search_and_replace_version_gradle $PROJECT_ROOT/kotlin/end-to-end-applications/kmp-android-todo-app/server