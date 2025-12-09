plugins {
  application
  kotlin("jvm") version "2.2.10"
  kotlin("plugin.serialization") version "2.2.10"
  id("com.google.devtools.ksp") version "2.2.10-2.0.2"
}

repositories {
  mavenCentral()
}

val restateVersion = "2.4.2"

dependencies {
  // Annotation processor
  ksp("dev.restate:sdk-api-kotlin-gen:$restateVersion")

  // Restate SDK
  implementation("dev.restate:sdk-kotlin-http:$restateVersion")

  // Logging
  implementation("org.apache.logging.log4j:log4j-api:2.24.3")
}

kotlin {
  jvmToolchain(21)
}

// Configure main class
application {
  mainClass.set("my.example.GreeterKt")
}
