import sbt.Keys._
import sbt._
import sbtprotoc.ProtocPlugin.autoImport.AsProtocPlugin

object Versions {

  lazy val restateVersion = "0.7.0"
  lazy val grpcVersion = "1.58.0"
}

object Dependencies {

  val restateDependencies = Seq(
    // Restate SDK
    "dev.restate" % "sdk-api" % Versions.restateVersion % "protobuf",
    "dev.restate" % "sdk-api" % Versions.restateVersion,
    "dev.restate" % "sdk-http-vertx" % Versions.restateVersion,
    // To use Jackson to read/write state entries (optional)
    "dev.restate" % "sdk-serde-jackson" % Versions.restateVersion
  )

  val grpcDependencies = Seq(
    // Protobuf and grpc dependencies
    "com.google.protobuf" % "protobuf-java" % "3.24.3",
    "io.grpc" % "grpc-stub" % "1.58.0",
    "io.grpc" % "grpc-protobuf" % "1.58.0",
    // This is needed to compile the @Generated annotation forced by the grpc compiler
    // See https://github.com/grpc/grpc-java/issues/9153
    "org.apache.tomcat" % "annotations-api" % "6.0.53" % "compile",

    // Code generation plugin
    "io.grpc" % "protoc-gen-grpc-java" % "1.58.0" asProtocPlugin ()
  )

  val loggingDependencies = Seq(
    // Logging (optional)
    "org.apache.logging.log4j" % "log4j-core" % "2.20.0",
    "org.apache.logging.log4j" %% "log4j-api-scala" % "13.0.0",
  )
}
