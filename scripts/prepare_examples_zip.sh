#!/usr/bin/env bash

OUT_DIR="$(pwd)"

zip_ts_example() {
  pushd typescript && zip -r typescript-$1.zip $1 -x '*node_modules*' '*dist*' && popd || exit
  mv typescript/typescript-$1.zip $OUT_DIR
  echo "Zip for $1 in $OUT_DIR/typescript-$1.zip"
}

zip_jvm_example() {
  pushd jvm && zip -r jvm-$1.zip $1 -x '*.gradle*' '*build*' '*.idea*' && popd || exit
  mv jvm/jvm-$1.zip $OUT_DIR
  echo "Zip for $1 in $OUT_DIR/jvm-$1.zip"
}

zip_ts_example lambda-greeter

zip_jvm_example java-blocking-http
zip_jvm_example java-blocking-lambda
zip_jvm_example kotlin-http
zip_jvm_example kotlin-lambda