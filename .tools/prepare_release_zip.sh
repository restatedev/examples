#!/usr/bin/env bash

OUT_DIR="$(pwd)"

gitzip() {
  # Uses git to zip current working directory.
  # This automatically excludes files excluded by .gitignore
  git archive HEAD -o $1.zip
}

# create_release_zip $input_dir $template-name
# Stores result in $OUT_DIR
create_release_zip() {
  pushd $1 && gitzip $2 && popd || exit
  mv "$1/$2.zip" "$OUT_DIR/$2.zip"
  echo "Zip for $1 in $OUT_DIR/$2.zip"
}

create_release_zip templates/java-gradle java-hello-world-gradle
create_release_zip templates/java-maven java-hello-world-maven
create_release_zip templates/java-maven-spring-boot java-hello-world-maven-spring-boot
create_release_zip templates/java-maven-quarkus java-hello-world-maven-quarkus
create_release_zip templates/kotlin-gradle kotlin-hello-world-gradle
create_release_zip templates/typescript typescript-hello-world
create_release_zip templates/bun typescript-bun-hello-world
create_release_zip templates/cloudflare-worker typescript-cloudflare-worker-hello-world
create_release_zip templates/deno typescript-deno-hello-world
create_release_zip templates/go go-hello-world
create_release_zip templates/rust rust-hello-world
create_release_zip templates/rust-shuttle rust-shuttle-hello-world
create_release_zip templates/typescript-lambda-cdk typescript-hello-world-lambda-cdk
create_release_zip templates/kotlin-gradle-lambda-cdk kotlin-hello-world-lambda-cdk
create_release_zip templates/python python-hello-world

create_release_zip tutorials/tour-of-restate-go go-tour-of-restate
create_release_zip tutorials/tour-of-restate-java java-tour-of-restate
create_release_zip tutorials/tour-of-restate-typescript typescript-tour-of-restate
create_release_zip tutorials/tour-of-restate-python python-tour-of-restate

create_release_zip patterns-use-cases/payment-state-machine/payment-state-machine-typescript typescript-payment-state-machine

create_release_zip end-to-end-applications/java/food-ordering java-food-ordering
create_release_zip end-to-end-applications/kotlin/food-ordering kotlin-food-ordering
create_release_zip end-to-end-applications/typescript/food-ordering typescript-food-ordering
create_release_zip end-to-end-applications/typescript/ai-image-workflows typescript-ai-image-workflows
create_release_zip end-to-end-applications/python/food-ordering python-food-ordering
