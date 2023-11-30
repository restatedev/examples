#!/usr/bin/env bash

OUT_DIR="$(pwd)"

gitzip() {
  # Uses git to create the zip. This automatically excludes files excluded by .gitignore
  git archive HEAD -o ${PWD##*/}.zip
}

create_release_zip() {
  pushd $1/$2 && gitzip && popd || exit
  mv "$1/$2/$2.zip" "$OUT_DIR/$1-$2.zip"
  echo "Zip for $1/$2 in $OUT_DIR/$1-$2.zip"
}

create_release_zip jvm hello-world-java-http
create_release_zip jvm hello-world-java-lambda
create_release_zip jvm hello-world-kotlin-http
create_release_zip jvm hello-world-kotlin-lambda

create_release_zip typescript hello-world-lambda
create_release_zip typescript ecommerce-store
create_release_zip typescript food-ordering
create_release_zip typescript payment-api
create_release_zip typescript ticket-reservation