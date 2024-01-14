import com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar
import com.github.jengelman.gradle.plugins.shadow.transformers.Log4j2PluginsCacheFileTransformer
import com.github.jengelman.gradle.plugins.shadow.transformers.ServiceFileTransformer
import com.google.protobuf.gradle.id

plugins {
  java

  id("com.google.protobuf") version "0.9.1"

  // To package the dependency for Lambda
  id("com.github.johnrengelman.shadow") version "7.1.2"
}

repositories {
  mavenCentral()
}

val restateVersion = "0.7.0"

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

// Configure shadowJar plugin to properly merge SPI files and Log4j plugin configurations
tasks.withType<ShadowJar> {
  transform(Log4j2PluginsCacheFileTransformer::class.java)
  transform(ServiceFileTransformer::class.java)
}

// Configure test platform
tasks.withType<Test> {
  useJUnitPlatform()
}
