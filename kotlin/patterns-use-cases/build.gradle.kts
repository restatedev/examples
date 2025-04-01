plugins {
  application
  kotlin("jvm") version "2.0.0"
  // Kotlinx serialization (optional)
  kotlin("plugin.serialization") version "2.0.0"

  id("com.google.devtools.ksp") version "2.0.0-1.0.21"
}

repositories {
  mavenCentral()
}

val restateVersion = "2.0.0-SNAPSHOT"

dependencies {
  // Annotation processor
  ksp("dev.restate:sdk-api-kotlin-gen:$restateVersion")

  // Restate SDK
  implementation("dev.restate:sdk-api-kotlin:$restateVersion")
  implementation("dev.restate:sdk-http-vertx:$restateVersion")

  // Logging (optional)
  implementation("org.apache.logging.log4j:log4j-core:2.24.1")

  // Kotlinx serialization (optional)
  implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
}

// Setup Java/Kotlin compiler target
java {
  toolchain {
    languageVersion.set(JavaLanguageVersion.of(17))
  }
}

// Configure main class
application {
  if (project.hasProperty("mainClass")) {
    mainClass.set(project.property("mainClass") as String)
  } else {
    mainClass.set("my.example.sagas.BookingWorkflowKt")
  }
}
