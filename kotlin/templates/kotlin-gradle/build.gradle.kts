plugins {
  application
  kotlin("jvm") version "2.1.20"
  kotlin("plugin.serialization") version "2.1.20"
  id("com.google.devtools.ksp") version "2.1.20-1.0.32"
}

repositories {
  mavenCentral()
}

val restateVersion = "2.1.0"

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
