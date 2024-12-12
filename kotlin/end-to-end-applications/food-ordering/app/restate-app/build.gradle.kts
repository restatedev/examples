plugins {
  application
  id("com.google.cloud.tools.jib") version "3.4.0"
  id("com.google.devtools.ksp") version "2.0.0-1.0.21"
}

repositories { mavenCentral() }

val restateVersion = "1.2.0"

dependencies {
  // Restate SDK
  ksp("dev.restate:sdk-api-kotlin-gen:$restateVersion")
  implementation("dev.restate:sdk-api-kotlin:$restateVersion")
  implementation("dev.restate:sdk-http-vertx:$restateVersion")

  // Kafka
  implementation("org.apache.kafka:kafka-clients:3.6.1")

  // Logging (optional)
  implementation("org.apache.logging.log4j:log4j-core:2.24.1")
}

// Set main class
application { mainClass.set("dev.restate.sdk.examples.AppMainKt") }

jib {
  to.image = "restate-app:0.0.1"
  container.mainClass = "dev.restate.sdk.examples.AppMainKt"
}
