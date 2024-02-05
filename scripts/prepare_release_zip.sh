#!/usr/bin/env bash

OUT_DIR="$(pwd)"

gitzip() {
  # Uses git to zip current working directory.
  # This automatically excludes files excluded by .gitignore
  git archive HEAD -o ${PWD##*/}.zip
}

# create_release_zip $language $template-name
# Stores result in $OUT_DIR
create_release_zip() {
  pushd $1/$2 && gitzip && popd || exit
  mv "$1/$2/$2.zip" "$OUT_DIR/$1-$2.zip"
  echo "Zip for $1/$2 in $OUT_DIR/$1-$2.zip"
}

create_release_zip java hello-world-http
create_release_zip java hello-world-lambda
create_release_zip java food-ordering
create_release_zip java tour-of-restate

create_release_zip kotlin hello-world-http
create_release_zip kotlin hello-world-lambda
create_release_zip kotlin hello-world-lambda-cdk

create_release_zip typescript hello-world-lambda
create_release_zip typescript hello-world-lambda-cdk
create_release_zip typescript end-to-end-testing
create_release_zip typescript ecommerce-store
create_release_zip typescript food-ordering
create_release_zip typescript payment-api
create_release_zip typescript ticket-reservation
create_release_zip typescript dynamic-workflow-executor
create_release_zip typescript tour-of-restate