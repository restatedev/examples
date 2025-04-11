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

create_release_zip python/basics python-basics
create_release_zip python/templates/python python-hello-world
create_release_zip python/patterns-use-cases python-patterns-use-cases
create_release_zip python/tutorials/tour-of-restate-python python-tour-of-restate
create_release_zip python/end-to-end-applications/chat-bot python-chat-bot
create_release_zip python/end-to-end-applications/rag-ingestion python-rag-ingestion
create_release_zip python/end-to-end-applications/food-ordering python-food-ordering

create_release_zip java/basics java-basics
create_release_zip java/end-to-end-applications/food-ordering java-food-ordering
create_release_zip java/end-to-end-applications/subway-fare-calculator java-subway-fare-calculator
create_release_zip java/patterns-use-cases java-patterns-use-cases
create_release_zip java/templates/java-gradle java-hello-world-gradle
create_release_zip java/templates/java-maven java-hello-world-maven
create_release_zip java/templates/java-maven-spring-boot java-hello-world-maven-spring-boot
create_release_zip java/templates/java-maven-quarkus java-hello-world-maven-quarkus
create_release_zip java/tutorials/tour-of-restate-java java-tour-of-restate

create_release_zip kotlin/basics kotlin-basics
create_release_zip kotlin/end-to-end-applications/food-ordering kotlin-food-ordering
create_release_zip kotlin/end-to-end-applications/kmp-android-todo-app kotlin-kmp-android-todo-app
create_release_zip kotlin/integrations/kotlin-gradle-lambda-cdk kotlin-hello-world-lambda-cdk
create_release_zip kotlin/patterns-use-cases kotlin-patterns-use-cases
create_release_zip kotlin/templates/kotlin-gradle kotlin-hello-world-gradle
create_release_zip kotlin/templates/kotlin-gradle-spring-boot kotlin-hello-world-gradle-spring-boot

create_release_zip typescript/basics typescript-basics
create_release_zip typescript/end-to-end-applications/food-ordering typescript-food-ordering
create_release_zip typescript/end-to-end-applications/chat-bot typescript-chat-bot
create_release_zip typescript/end-to-end-applications/ai-image-workflows typescript-ai-image-workflows
create_release_zip typescript/integrations/deployment-lambda-cdk typescript-hello-world-lambda-cdk
create_release_zip typescript/patterns-use-cases typescript-patterns-use-cases
create_release_zip typescript/templates/node typescript-hello-world
create_release_zip typescript/templates/bun typescript-bun-hello-world
create_release_zip typescript/templates/cloudflare-worker typescript-cloudflare-worker-hello-world
create_release_zip typescript/templates/deno typescript-deno-hello-world
create_release_zip typescript/templates/nextjs typescript-nextjs-hello-world
create_release_zip typescript/tutorials/tour-of-restate-typescript typescript-tour-of-restate

create_release_zip go/basics go-basics
create_release_zip go/integrations/go-lambda-cdk go-hello-world-lambda-cdk
create_release_zip go/integrations/knative-go go-knative-go
create_release_zip go/patterns-use-cases go-patterns-use-cases
create_release_zip go/templates/go go-hello-world
create_release_zip go/tutorials/tour-of-restate-go go-tour-of-restate

create_release_zip rust/basics rust-basics
create_release_zip rust/templates/rust rust-hello-world
create_release_zip rust/templates/rust-shuttle rust-shuttle-hello-world
create_release_zip rust/tutorials/tour-of-restate-rust rust-tour-of-restate
