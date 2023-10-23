import com.google.protobuf.gradle.id

plugins {
  java

  id("com.google.protobuf") version "0.9.1"

  // To package the dependency for Lambda
  id("com.github.johnrengelman.shadow") version "7.1.2"
}

dependencies {
  repositories {
    mavenCentral()
    maven {
      url = uri("https://maven.pkg.github.com/restatedev/sdk-java")
      credentials {
        username = System.getenv("GH_PACKAGE_READ_ACCESS_USER")
        password = System.getenv("GH_PACKAGE_READ_ACCESS_TOKEN")
      }
    }
  }

  // Restate SDK
  implementation("dev.restate.sdk:sdk-java-blocking:1.0-SNAPSHOT")
  implementation("dev.restate.sdk:sdk-lambda:1.0-SNAPSHOT")
  // To use Jackson to read/write state entries (optional)
  implementation("dev.restate.sdk:sdk-serde-jackson:1.0-SNAPSHOT")

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

  plugins {
    id("grpc") { artifact = "io.grpc:protoc-gen-grpc-java:1.58.0" }
  }

  generateProtoTasks {
    all().forEach {
      it.plugins {
        id("grpc")
      }
    }
  }
}

// Temporary solution for disabling caching of Java SDK until we release it
configurations.all {
  // This disables caching for -SNAPSHOT dependencies
  resolutionStrategy.cacheChangingModulesFor(0, "seconds")
}
