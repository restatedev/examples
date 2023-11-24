import com.google.protobuf.gradle.id
import org.jetbrains.kotlin.gradle.tasks.KotlinCompile

plugins {
  kotlin("jvm") version "1.9.10"

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
  implementation("dev.restate:sdk-kotlin:$restateVersion")
  implementation("dev.restate:sdk-lambda:$restateVersion")
  // To use Jackson to read/write state entries (optional)
  implementation("dev.restate:sdk-serde-jackson:$restateVersion")

  // Protobuf and grpc dependencies (we need the Java dependencies as well because the Kotlin dependencies rely on Java)
  implementation("com.google.protobuf:protobuf-java:3.24.3")
  implementation("com.google.protobuf:protobuf-kotlin:3.24.3")
  implementation("io.grpc:grpc-stub:1.58.0")
  implementation("io.grpc:grpc-protobuf:1.58.0")
  implementation("io.grpc:grpc-kotlin-stub:1.4.0") { exclude("javax.annotation", "javax.annotation-api") }
  // This is needed to compile the @Generated annotation forced by the grpc compiler
  // See https://github.com/grpc/grpc-java/issues/9153
  compileOnly("org.apache.tomcat:annotations-api:6.0.53")

  // To specify the coroutines dispatcher
  implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

  // Logging (optional)
  implementation("org.apache.logging.log4j:log4j-core:2.20.0")

  // Testing (optional)
  testImplementation("org.junit.jupiter:junit-jupiter:5.9.1")
  testImplementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.7.3")
  testImplementation("dev.restate:sdk-test:$restateVersion")
}

// Setup Java/Kotlin compiler target
java {
  toolchain {
    languageVersion.set(JavaLanguageVersion.of(17))
  }
}

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

// Configure test platform
tasks.withType<Test> {
  useJUnitPlatform()
}