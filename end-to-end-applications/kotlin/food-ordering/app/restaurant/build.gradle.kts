plugins {
  application
  id("com.google.cloud.tools.jib") version "3.4.0"
}

repositories { mavenCentral() }

val restateVersion = "1.1.1"

dependencies {
  // Kafka
  implementation("org.apache.kafka:kafka-clients:3.6.1")

  // SDK common (contains the restate http client)
  implementation("dev.restate:sdk-common:$restateVersion")
  implementation("dev.restate:sdk-api-kotlin:$restateVersion")
}

// Set main class
application { mainClass.set("dev.restate.sdk.examples.RestaurantMainKt") }

jib {
  to.image = "restaurant-app:0.0.1"
  container.mainClass = "dev.restate.sdk.examples.RestaurantMainKt"
}
