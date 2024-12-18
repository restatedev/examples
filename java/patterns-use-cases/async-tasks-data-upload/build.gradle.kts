import java.net.URI

plugins {
  java
  application
}

repositories {
  mavenCentral()
}

val restateVersion = "1.2.0"

dependencies {
  annotationProcessor("dev.restate:sdk-api-gen:$restateVersion")

  // Restate SDK
  implementation("dev.restate:sdk-api:$restateVersion")
  implementation("dev.restate:sdk-http-vertx:$restateVersion")
  // To use Jackson to read/write state entries (optional)
  implementation("dev.restate:sdk-serde-jackson:$restateVersion")

  // Logging (optional)
  implementation("org.apache.logging.log4j:log4j-core:2.24.1")

  testImplementation(platform("org.junit:junit-bom:5.11.3"))
  testImplementation("org.junit.jupiter:junit-jupiter")
  testImplementation("dev.restate:sdk-testing:$restateVersion")
}

// Set main class
application {
  if (project.hasProperty("mainClass")) {
    mainClass.set(project.property("mainClass") as String)
  } else {
    mainClass.set("my.example.DataUploadService")
  }
}

tasks.named<Test>("test") {
  useJUnitPlatform()
}

java {
  toolchain {
    languageVersion.set(JavaLanguageVersion.of(17))
  }
}