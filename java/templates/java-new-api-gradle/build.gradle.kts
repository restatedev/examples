plugins {
  java
  application
}

repositories {
  mavenCentral()
}

val restateVersion = "2.6.0"

dependencies {
  // Restate SDK
  implementation("dev.restate:sdk-java-http:$restateVersion")

  // Logging
  implementation("org.apache.logging.log4j:log4j-api:2.24.1")

  // JUnit (API & test launcher)
  testImplementation("org.junit.jupiter:junit-jupiter:5.14.1")
  testRuntimeOnly("org.junit.platform:junit-platform-launcher:1.14.2")
  testImplementation("dev.restate:sdk-testing:$restateVersion")
}

java {
  toolchain {
    languageVersion.set(JavaLanguageVersion.of(17))
  }
}

// Set main class
application {
  mainClass.set("my.example.Greeter")
}

tasks.named<Test>("test") {
  useJUnitPlatform()
}
