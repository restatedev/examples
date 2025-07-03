plugins {
  application
  kotlin("jvm") version "2.0.0"
  kotlin("plugin.serialization") version "2.0.0"
  id("com.google.devtools.ksp") version "2.0.0-1.0.21"
  id("com.diffplug.spotless") version "6.25.0"
}

repositories { mavenCentral() }

val restateVersion = "2.2.0"

dependencies {
  // Annotation processor
  ksp("dev.restate:sdk-api-kotlin-gen:$restateVersion")

  // Restate SDK
  implementation("dev.restate:sdk-kotlin-http:$restateVersion")

  // Logging
  implementation("org.apache.logging.log4j:log4j-api:2.24.1")

  // Kotlinx serialization
  implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
}

kotlin { jvmToolchain(21) }

// Configure main class
application {
  if (project.hasProperty("mainClass")) {
    mainClass.set(project.property("mainClass") as String)
  } else {
    mainClass.set("my.example.sagas.BookingWorkflowKt")
  }
}

spotless {
  kotlin {
    targetExclude("build/generated/**/*.kt")
    ktfmt()
  }
  kotlinGradle { ktfmt() }
}
