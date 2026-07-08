plugins {
  application
  id("com.google.cloud.tools.jib") version "3.5.3"
}

repositories {
  mavenCentral()
}

val restateVersion = "2.9.0"

dependencies {
  // Kafka
  implementation("org.apache.kafka:kafka-clients:3.6.1")

  implementation("dev.restate:client-kotlin:$restateVersion")

  // Need this to deserialize input http requests
  implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.8.0")
}

// Set main class
application {
  mainClass.set("dev.restate.sdk.examples.RestaurantMainKt")
  // Java 25 warnings: --enable-native-access for the Restate SDK state machine,
  // --sun-misc-unsafe-memory-access for netty.
  applicationDefaultJvmArgs =
      listOf("--enable-native-access=ALL-UNNAMED", "--sun-misc-unsafe-memory-access=allow")
}

jib {
  to.image = "restaurant-app:0.0.1"
  container.mainClass = "dev.restate.sdk.examples.RestaurantMainKt"
}
