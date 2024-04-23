import java.net.URI
import com.github.jengelman.gradle.plugins.shadow.tasks.ShadowJar
import com.github.jengelman.gradle.plugins.shadow.transformers.Log4j2PluginsCacheFileTransformer
import com.github.jengelman.gradle.plugins.shadow.transformers.ServiceFileTransformer

plugins {
  kotlin("jvm") version "1.9.22"
  // Kotlinx serialization (optional)
  kotlin("plugin.serialization") version "1.9.22"

  id("com.google.devtools.ksp") version "1.9.22-1.0.18"

  // To package the dependency for Lambda
  id("com.github.johnrengelman.shadow") version "8.1.1"
}

repositories {
  maven {
    url = URI.create("https://s01.oss.sonatype.org/content/repositories/snapshots/")
  }
  mavenCentral()
}

val restateVersion = "0.9.0-SNAPSHOT"

dependencies {
  // Annotation processor
  ksp("dev.restate:sdk-api-kotlin-gen:$restateVersion")

  // Restate SDK
  implementation("dev.restate:sdk-api-kotlin:$restateVersion")
  implementation("dev.restate:sdk-lambda:$restateVersion")

  // Kotlinx serialization (optional)
  implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")

  // To specify the coroutines dispatcher
  implementation("org.jetbrains.kotlinx:kotlinx-coroutines-core:1.7.3")

  // AWS Lambda-specific logging, see https://docs.aws.amazon.com/lambda/latest/dg/java-logging.html#java-logging-log4j2
  val log4j2version = "2.22.0"
  implementation("org.apache.logging.log4j:log4j-core:$log4j2version")
  implementation("org.apache.logging.log4j:log4j-layout-template-json:$log4j2version")
  implementation("com.amazonaws:aws-lambda-java-log4j2:1.6.0")
}

// Setup Java/Kotlin compiler target
java {
  toolchain {
    languageVersion.set(JavaLanguageVersion.of(17))
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