import sbt.Keys._
import sbt._

name := "hello-world-http"
version := "1.0"
scalaVersion := "2.12.8"


lazy val restateVersion = "0.7.0"
libraryDependencies ++= Seq(
  // Restate SDK
  "dev.restate" % "sdk-api" % restateVersion % "protobuf",
  "dev.restate" % "sdk-api" % restateVersion,
  "dev.restate" % "sdk-http-vertx" % restateVersion,
  // To use Jackson to read/write state entries (optional)
  "dev.restate" % "sdk-serde-jackson" % restateVersion,

  // Protobuf and grpc dependencies
  "com.google.protobuf" % "protobuf-java" % "3.24.3",
  "io.grpc" % "grpc-stub" % "1.58.0",
  "io.grpc" % "grpc-protobuf" % "1.58.0",
  // This is needed to compile the @Generated annotation forced by the grpc compiler
  // See https://github.com/grpc/grpc-java/issues/9153
  "org.apache.tomcat" % "annotations-api" % "6.0.53" % "compile",

  // Logging (optional)
  "org.apache.logging.log4j" % "log4j-core" % "2.20.0",
  "org.apache.logging.log4j" %% "log4j-api-scala" % "13.0.0",

  "io.grpc" % "protoc-gen-grpc-java" % "1.58.0" asProtocPlugin ()
)

Compile / PB.targets := Seq(
  PB.gens.java                -> (Compile / sourceManaged).value,
  PB.gens.plugin("grpc-java") -> (Compile / sourceManaged).value
)
// Configure test platform
testFrameworks += new TestFramework("org.junit.platform.sbt.JUnitPlatform")
// Set main class
Compile / mainClass := Some("dev.restate.sdk.examples.Main")
run / mainClass := Some("dev.restate.sdk.examples.Main")
Compile / run / fork := true

