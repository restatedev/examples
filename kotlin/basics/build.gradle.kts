plugins {
  application
  kotlin("jvm") version "2.0.0"
  kotlin("plugin.serialization") version "2.0.0"
  id("com.google.devtools.ksp") version "2.0.0-1.0.21"
}

repositories {
  mavenCentral()
}

val restateVersion = "2.3.0"

dependencies {
  // Annotation processor
  ksp("dev.restate:sdk-api-kotlin-gen:$restateVersion")

  // Restate SDK
  implementation("dev.restate:sdk-kotlin-http:$restateVersion")
  implementation("org.apache.logging.log4j:log4j-api:2.24.1")
}

kotlin {
  jvmToolchain(21)
}

// Set main class
application {
  if (project.hasProperty("mainClass")) {
    mainClass.set(project.property("mainClass") as String)
  } else {
    mainClass.set("durable_execution.RoleUpdateServiceKt")
  }
}
