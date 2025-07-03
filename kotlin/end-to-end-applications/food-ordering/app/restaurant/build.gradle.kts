plugins {
  application
  id("com.google.cloud.tools.jib") version "3.4.0"
}

repositories {
  mavenCentral()
}

val restateVersion = "2.2.0"

dependencies {
  // Kafka
  implementation("org.apache.kafka:kafka-clients:3.6.1")

  implementation("dev.restate:client-kotlin:$restateVersion")

  // Need this to deserialize input http requests
  implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.8.0")
}

// Set main class
application { mainClass.set("dev.restate.sdk.examples.RestaurantMainKt") }

jib {
  to.image = "restaurant-app:0.0.1"
  container.mainClass = "dev.restate.sdk.examples.RestaurantMainKt"
}
