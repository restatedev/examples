#!/usr/bin/env bash

set -eufx -o pipefail

SELF_PATH=${BASH_SOURCE[0]:-"$(command -v -- "$0")"}
PROJECT_ROOT="$(dirname "$SELF_PATH")/.."

pushd $PROJECT_ROOT/templates/java-gradle && ./gradlew check && popd
pushd $PROJECT_ROOT/templates/java-maven && mvn verify && popd
pushd $PROJECT_ROOT/templates/kotlin-gradle && ./gradlew check && popd
pushd $PROJECT_ROOT/templates/kotlin-gradle-lambda-cdk/lambda && ./gradlew check && popd

pushd $PROJECT_ROOT/basics/basics-java && ./gradlew check && popd

pushd $PROJECT_ROOT/patterns-use-cases/sagas/sagas-java && ./gradlew check && popd
pushd $PROJECT_ROOT/patterns-use-cases/payment-state-machine/payment-state-machine-java && ./gradlew check && popd
pushd $PROJECT_ROOT/patterns-use-cases/async-signals-payment/async-signals-payment-java && ./gradlew check && popd
pushd $PROJECT_ROOT/patterns-use-cases/integrations/java-spring && ./gradlew check && popd

pushd $PROJECT_ROOT/tutorials/tour-of-restate-java && ./gradlew check && popd

pushd $PROJECT_ROOT/end-to-end-applications/java/food-ordering/app && ./gradlew check && popd
pushd $PROJECT_ROOT/end-to-end-applications/kotlin/food-ordering/app && ./gradlew check && popd
