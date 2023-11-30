import com.google.protobuf.gradle.id

plugins {
  java

  id("com.google.protobuf") version "0.9.1"

  // To package the dependency for Lambda
  id("com.github.johnrengelman.shadow") version "7.1.2"
}

repositories {
  mavenCentral()
  // OSSRH Snapshots repo
  // TODO remove it once we have the proper release
  maven { url = uri("https://s01.oss.sonatype.org/content/repositories/snapshots/") }
}

val restateVersion = "0.0.1-SNAPSHOT"

dependencies {
  // Restate SDK
  implementation("dev.restate:sdk-api:$restateVersion")
  implementation("dev.restate:sdk-lambda:$restateVersion")
  // To use Jackson to read/write state entries (optional)
  implementation("dev.restate:sdk-serde-jackson:$restateVersion")

  // Protobuf and grpc dependencies
  implementation("com.google.protobuf:protobuf-java:3.24.3")
  implementation("io.grpc:grpc-stub:1.58.0")
  implementation("io.grpc:grpc-protobuf:1.58.0")
  // This is needed to compile the @Generated annotation forced by the grpc compiler
  // See https://github.com/grpc/grpc-java/issues/9153
  compileOnly("org.apache.tomcat:annotations-api:6.0.53")

  // Logging (optional)
  implementation("org.apache.logging.log4j:log4j-core:2.20.0")

  // Testing (optional)
  testImplementation("org.junit.jupiter:junit-jupiter:5.9.1")
  testImplementation("dev.restate:sdk-testing:$restateVersion")
}

// Configure protoc plugin
protobuf {
  protoc { artifact = "com.google.protobuf:protoc:3.24.3" }

  // We need both grpc and restate codegen(s) because the restate codegen depends on the grpc one
  plugins {
    id("grpc") { artifact = "io.grpc:protoc-gen-grpc-java:1.58.0" }
    id("restate") { artifact = "dev.restate:protoc-gen-restate:$restateVersion:all@jar" }
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

// Configure test platform
tasks.withType<Test> {
  useJUnitPlatform()
}
