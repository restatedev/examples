plugins {
  application
  id("com.google.cloud.tools.jib") version "3.5.3"
}

repositories {
  mavenCentral()
}

val restateVersion = "2.9.1"

dependencies {
  // Restate SDK
  implementation("dev.restate:sdk-kotlin-http:$restateVersion")

  // Kafka
  implementation("org.apache.kafka:kafka-clients:3.6.1")
}

// Set main class
application {
  mainClass.set("dev.restate.sdk.examples.AppMainKt")
  // Java 25 warnings: --enable-native-access for the Restate SDK state machine,
  // --sun-misc-unsafe-memory-access for netty.
  applicationDefaultJvmArgs =
      listOf("--enable-native-access=ALL-UNNAMED", "--sun-misc-unsafe-memory-access=allow")
}

jib {
  to.image = "restate-app:0.0.1"
  container.mainClass = "dev.restate.sdk.examples.AppMainKt"
}
