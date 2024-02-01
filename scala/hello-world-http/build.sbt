import sbt.Keys._
import sbt._

name := "hello-world-http"
version := "1.0"
scalaVersion := "2.13.12"

libraryDependencies ++= Dependencies.restateDependencies ++
  Dependencies.grpcDependencies ++
  Dependencies.loggingDependencies

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

