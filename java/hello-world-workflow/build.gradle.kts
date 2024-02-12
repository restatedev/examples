import com.google.protobuf.gradle.id

plugins {
  java
  application

  id("com.google.protobuf") version "0.9.1"
}

repositories {
  mavenCentral()
  maven("https://s01.oss.sonatype.org/content/repositories/snapshots/")
}

val restateVersion = "0.8.0-SNAPSHOT"

dependencies {
  // Restate SDK
  annotationProcessor("dev.restate:sdk-api-gen:$restateVersion")
  implementation("dev.restate:sdk-api:$restateVersion")
  implementation("dev.restate:sdk-workflow-api:$restateVersion")
  implementation("dev.restate:sdk-http-vertx:$restateVersion")
  // To use Jackson to read/write state entries (optional)
  implementation("dev.restate:sdk-serde-jackson:$restateVersion")

  // Logging (optional)
  implementation("org.apache.logging.log4j:log4j-core:2.20.0")

  // Testing (optional)
  testImplementation("org.junit.jupiter:junit-jupiter:5.9.1")
  testImplementation("dev.restate:sdk-testing:$restateVersion")
}

// Configure test platform
tasks.withType<Test> {
  useJUnitPlatform()
}

// Set main class
application {
  mainClass.set("my.restate.examples.LoanApproval")
}