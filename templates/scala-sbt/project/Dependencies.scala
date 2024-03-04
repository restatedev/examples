import sbt.Keys._
import sbt._
import sbtprotoc.ProtocPlugin.autoImport.AsProtocPlugin

object Versions {
  lazy val grpc = "1.58.0"
  lazy val log4j = "2.20.0"
  lazy val log4jApiScala = "13.0.0"
  lazy val protobufJava = "3.24.3"
  lazy val restate = "0.8.0"
  lazy val scalaTests = "3.2.17"
  lazy val tomcat = "6.0.53"
}

object Dependencies {

  val restateDependencies: Seq[ModuleID] = Seq(
    "dev.restate" % "sdk-api" % Versions.restate % "protobuf",
    "dev.restate" % "sdk-api" % Versions.restate,
    "dev.restate" % "sdk-http-vertx" % Versions.restate,
    // To use Jackson to read/write state entries (optional)
    "dev.restate" % "sdk-serde-jackson" % Versions.restate,
  )

  val grpcDependencies: Seq[ModuleID] = Seq(
    "com.google.protobuf" % "protobuf-java" % Versions.protobufJava,
    "io.grpc" % "grpc-stub" % Versions.grpc,
    "io.grpc" % "grpc-protobuf" % Versions.grpc,
    // This is needed to compile the @Generated annotation forced by the grpc compiler
    // See https://github.com/grpc/grpc-java/issues/9153
    "org.apache.tomcat" % "annotations-api" % Versions.tomcat % Compile,

    // Code generation plugin
    "io.grpc" % "protoc-gen-grpc-java" % Versions.grpc asProtocPlugin ()
  )

  val loggingDependencies: Seq[ModuleID] = Seq(
    "org.apache.logging.log4j" % "log4j-core" % Versions.log4j,
    "org.apache.logging.log4j" %% "log4j-api-scala" % Versions.log4jApiScala
  )
}
