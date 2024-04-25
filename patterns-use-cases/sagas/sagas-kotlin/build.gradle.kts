import java.net.URI

plugins {
  application
  kotlin("jvm") version "1.9.22"
  // Kotlinx serialization (optional)
  kotlin("plugin.serialization") version "1.9.22"

  id("com.google.devtools.ksp") version "1.9.22-1.0.18"
}

repositories {
  mavenCentral()
}

val restateVersion = "0.9.0"

dependencies {
  // Annotation processor
  ksp("dev.restate:sdk-api-kotlin-gen:$restateVersion")

  // Restate SDK
  implementation("dev.restate:sdk-api-kotlin:$restateVersion")
  implementation("dev.restate:sdk-http-vertx:$restateVersion")

  // Logging (optional)
  implementation("org.apache.logging.log4j:log4j-core:2.20.0")

  // Kotlinx serialization (optional)
  implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
}

// Setup Java/Kotlin compiler target
java {
  toolchain {
    languageVersion.set(JavaLanguageVersion.of(17))
  }
}
