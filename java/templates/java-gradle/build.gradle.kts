plugins {
  java
  application
}

repositories {
  mavenCentral()
}

val restateVersion = "2.1.0"

dependencies {
  annotationProcessor("dev.restate:sdk-api-gen:$restateVersion")

  // Restate SDK
  implementation("dev.restate:sdk-java-http:$restateVersion")

  // Logging (optional)
  implementation("org.apache.logging.log4j:log4j-api:2.24.1")

  testImplementation(platform("org.junit:junit-bom:5.11.3"))
  testImplementation("org.junit.jupiter:junit-jupiter")
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
