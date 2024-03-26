import java.net.URI

plugins {
  application
  kotlin("jvm") version "1.9.22"

  id("com.google.devtools.ksp") version "1.9.22-1.0.18"
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
  implementation("dev.restate:sdk-http-vertx:$restateVersion")

  // Logging (optional)
  implementation("org.apache.logging.log4j:log4j-core:2.20.0")
}

// Setup Java/Kotlin compiler target
java {
  toolchain {
    languageVersion.set(JavaLanguageVersion.of(17))
  }
}

// Configure main class
application {
  mainClass.set("my.example.GreeterKt")
}
