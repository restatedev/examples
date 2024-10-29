#!/usr/bin/env bash

NEW_VERSION=$1
SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

function search_and_replace_version_gradle() {
  sed -i 's/val restateVersion = "[0-9A-Z.-]*"/val restateVersion = "'$NEW_VERSION'"/' $1/build.gradle.kts
}

function search_and_replace_version_maven() {
  pushd $1 && mvn versions:set-property -Dproperty=restate.version -DnewVersion=$NEW_VERSION && popd || exit
}

search_and_replace_version_gradle $PROJECT_ROOT/templates/java-gradle
search_and_replace_version_maven $PROJECT_ROOT/templates/java-maven
search_and_replace_version_maven $PROJECT_ROOT/templates/java-maven-quarkus
search_and_replace_version_maven $PROJECT_ROOT/templates/java-maven-spring-boot
search_and_replace_version_gradle $PROJECT_ROOT/templates/kotlin-gradle
search_and_replace_version_gradle $PROJECT_ROOT/templates/kotlin-gradle-lambda-cdk/lambda

search_and_replace_version_gradle $PROJECT_ROOT/basics/basics-java
search_and_replace_version_gradle $PROJECT_ROOT/basics/basics-kotlin

search_and_replace_version_gradle $PROJECT_ROOT/patterns-use-cases/sagas/sagas-java
search_and_replace_version_gradle $PROJECT_ROOT/patterns-use-cases/async-signals-payment/async-signals-payment-java
search_and_replace_version_gradle $PROJECT_ROOT/patterns-use-cases/payment-state-machine/payment-state-machine-java
search_and_replace_version_gradle $PROJECT_ROOT/patterns-use-cases/sagas/sagas-kotlin
search_and_replace_version_gradle $PROJECT_ROOT/patterns-use-cases/integrations/java-spring

search_and_replace_version_gradle $PROJECT_ROOT/tutorials/tour-of-restate-java

search_and_replace_version_gradle $PROJECT_ROOT/end-to-end-applications/java/food-ordering/app/restate-app
search_and_replace_version_gradle $PROJECT_ROOT/end-to-end-applications/java/food-ordering/app/restaurant
search_and_replace_version_gradle $PROJECT_ROOT/end-to-end-applications/kotlin/food-ordering/app/restate-app
search_and_replace_version_gradle $PROJECT_ROOT/end-to-end-applications/kotlin/food-ordering/app/restaurant