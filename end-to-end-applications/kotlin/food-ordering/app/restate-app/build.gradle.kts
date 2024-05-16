plugins {
  application
  id("com.google.cloud.tools.jib") version "3.4.0"
  id("com.google.devtools.ksp") version "1.9.22-1.0.18"
}

repositories { mavenCentral() }

val restateVersion = "0.9.2"

dependencies {
  // Restate SDK
  ksp("dev.restate:sdk-api-kotlin-gen:$restateVersion")
  implementation("dev.restate:sdk-api-kotlin:$restateVersion")
  implementation("dev.restate:sdk-http-vertx:$restateVersion")

  // Kafka
  implementation("org.apache.kafka:kafka-clients:3.6.1")

  // Logging (optional)
  implementation("org.apache.logging.log4j:log4j-core:2.20.0")
}

// Set main class
application { mainClass.set("dev.restate.sdk.examples.AppMainKt") }

jib {
  to.image = "restate-app:0.0.1"
  container.mainClass = "dev.restate.sdk.examples.AppMainKt"
}
