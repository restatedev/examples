import com.google.protobuf.gradle.id

plugins {
  java
  application

  id("com.google.protobuf") version "0.9.1"
}

repositories {
  mavenCentral()
}

val restateSdkVersion = "0.8.0"

dependencies {
  // Restate SDK
  implementation("dev.restate:sdk-api:$restateSdkVersion")
  implementation("dev.restate:sdk-http-vertx:$restateSdkVersion")
  // To use Jackson to read/write state entries (optional)
  implementation("dev.restate:sdk-serde-jackson:$restateSdkVersion")

  // Protobuf and grpc dependencies
  implementation("com.google.protobuf:protobuf-java:3.24.3")
  implementation("io.grpc:grpc-stub:1.58.0")
  implementation("io.grpc:grpc-protobuf:1.58.0")
  // This is needed to compile the @Generated annotation forced by the grpc compiler
  // See https://github.com/grpc/grpc-java/issues/9153
  compileOnly("org.apache.tomcat:annotations-api:6.0.53")

  // Logging (optional)
  implementation("org.apache.logging.log4j:log4j-core:2.20.0")
}

// Configure protoc plugin
protobuf {
  protoc { artifact = "com.google.protobuf:protoc:3.24.3" }

  // We need both grpc and restate codegen(s) because the restate codegen depends on the grpc one
  plugins {
    id("grpc") { artifact = "io.grpc:protoc-gen-grpc-java:1.58.0" }
    id("restate") { artifact = "dev.restate:protoc-gen-restate:$restateSdkVersion:all@jar" }
  }

  generateProtoTasks {
    all().forEach {
      it.plugins {
        id("grpc")
        id("restate")
      }
    }
  }
}

// Set main class
application {
  if (project.hasProperty("mainClass")) {
    mainClass.set(project.property("mainClass") as String);
  } else {
    mainClass.set("dev.restate.tour.app.AppMain")
  }
}
