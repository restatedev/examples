import java.net.URI

plugins {
  java
  application
}

repositories {
  mavenCentral()
}

val restateVersion = "0.9.0"

dependencies {
  annotationProcessor("dev.restate:sdk-api-gen:$restateVersion")

  // Restate SDK
  implementation("dev.restate:sdk-api:$restateVersion")
  implementation("dev.restate:sdk-http-vertx:$restateVersion")
  // To use Jackson to read/write state entries (optional)
  implementation("dev.restate:sdk-serde-jackson:$restateVersion")

  // Logging (optional)
  implementation("org.apache.logging.log4j:log4j-core:2.20.0")
}
