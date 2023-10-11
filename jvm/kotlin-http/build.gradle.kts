import com.google.protobuf.gradle.id
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
  kotlin("jvm") version "1.9.10"
  application
  id("com.google.protobuf") version "0.9.1"

  // Code formatter (optional)
  id("com.diffplug.spotless") version "6.6.1"

  // To build the docker image (optional)
  id("com.google.cloud.tools.jib") version "3.2.1"
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
  implementation("dev.restate.sdk:sdk-kotlin:1.0-SNAPSHOT")
  implementation("dev.restate.sdk:sdk-http-vertx:1.0-SNAPSHOT")
  // To use Jackson to read/write state entries (optional)
  implementation("dev.restate.sdk:sdk-serde-jackson:1.0-SNAPSHOT")

  // Protobuf and grpc dependencies (we need the Java dependencies as well because the Kotlin dependencies rely on Java)
  implementation("com.google.protobuf:protobuf-java:3.24.3")
  implementation("com.google.protobuf:protobuf-kotlin:3.24.3")
  implementation("io.grpc:grpc-stub:1.58.0")
  implementation("io.grpc:grpc-protobuf:1.58.0")
  implementation("io.grpc:grpc-kotlin-stub:1.4.0") { exclude("javax.annotation", "javax.annotation-api") }
  // This is needed to compile the @Generated annotation forced by the grpc compiler
  // See https://github.com/grpc/grpc-java/issues/9153
  compileOnly("org.apache.tomcat:annotations-api:6.0.53")

  // Vert.x runtime to run coroutines
  implementation("io.vertx:vertx-core:4.4.5")
  implementation("io.vertx:vertx-lang-kotlin-coroutines:4.4.5")

  // Logging (optional)
  implementation("org.apache.logging.log4j:log4j-core:2.20.0")
}

// Setup Java and Kotlin compiler target
tasks.withType<JavaCompile>().configureEach {
  targetCompatibility = "11"
  sourceCompatibility = "11"
}
tasks.withType<KotlinCompile> { kotlinOptions.jvmTarget = "11" }

// Configure protoc plugin
protobuf {
  protoc { artifact = "com.google.protobuf:protoc:3.24.3" }

  plugins {
    id("grpc") { artifact = "io.grpc:protoc-gen-grpc-java:1.58.0" }
    id("grpckt") { artifact = "io.grpc:protoc-gen-grpc-kotlin:1.4.0:jdk8@jar" }
  }

  generateProtoTasks {
    all().forEach {
      // We need both java and kotlin codegen(s) because the kotlin protobuf/grpc codegen depends on the java ones
      it.plugins {
        id("grpc")
        id("grpckt")
      }
      it.builtins {
        java {}
        id("kotlin")
      }
    }
  }
}

// Configure code formatter
configure<com.diffplug.gradle.spotless.SpotlessExtension> {
  kotlin {
    ktfmt()
    targetExclude("build/generated/**/*.kt")
  }
}

application {
  mainClass.set("dev.restate.sdk.examples.GreeterKt")
}

// Temporary solution for disabling caching of Java SDK until we release it
configurations.all {
  // This disables caching for -SNAPSHOT dependencies
  resolutionStrategy.cacheChangingModulesFor(0, "seconds")
}