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
create_release_zip templates/kotlin-gradle kotlin-hello-world-gradle
create_release_zip templates/scala-sbt scala-hello-world-sbt
create_release_zip templates/typescript typescript-hello-world

create_release_zip basics/basics-typescript typescript-basics

create_release_zip tutorials/tour-of-restate-java java-tour-of-restate
create_release_zip tutorials/tour-of-restate-typescript typescript-tour-of-restate