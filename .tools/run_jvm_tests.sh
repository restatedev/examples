#!/usr/bin/env bash

set -eufx -o pipefail

SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

pushd $PROJECT_ROOT/java/templates/java-gradle && ./gradlew --console=plain check && popd
pushd $PROJECT_ROOT/java/templates/java-maven && mvn verify && popd
pushd $PROJECT_ROOT/java/templates/java-maven-quarkus && mvn verify && popd
pushd $PROJECT_ROOT/java/templates/java-maven-spring-boot && mvn verify && popd
pushd $PROJECT_ROOT/kotlin/templates/kotlin-gradle && ./gradlew --console=plain check && popd

pushd $PROJECT_ROOT/java/basics && ./gradlew --console=plain check && popd
pushd $PROJECT_ROOT/kotlin/basics && ./gradlew --console=plain check && popd

pushd $PROJECT_ROOT/kotlin/integrations/kotlin-gradle-lambda-cdk/lambda && ./gradlew --console=plain check && popd

pushd $PROJECT_ROOT/java/patterns-use-cases && ./gradlew --console=plain check && popd
pushd $PROJECT_ROOT/kotlin/patterns-use-cases && ./gradlew --console=plain check && popd

pushd $PROJECT_ROOT/java/tutorials/tour-of-restate-java && ./gradlew --console=plain check && popd

pushd $PROJECT_ROOT/java/end-to-end-applications/food-ordering/app && ./gradlew --console=plain check && popd
pushd $PROJECT_ROOT/java/end-to-end-applications/subway-fare-calculator && ./gradlew --console=plain check && popd
pushd $PROJECT_ROOT/java/end-to-end-applications/workflow-interpreter && ./gradlew --console=plain check && popd
pushd $PROJECT_ROOT/kotlin/end-to-end-applications/food-ordering/app && ./gradlew --console=plain check && popd
pushd $PROJECT_ROOT/kotlin/end-to-end-applications/kmp-android-todo-app && ./gradlew --console=plain check && popd
