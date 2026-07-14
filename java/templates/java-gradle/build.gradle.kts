plugins {
  java
  application
}

repositories {
  mavenCentral()
}

val restateVersion = "2.9.1"

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
    languageVersion.set(JavaLanguageVersion.of(25))
  }
}

// Set main class
application {
  mainClass.set("my.example.Greeter")
  // Java 25 warnings: --enable-native-access for the Restate SDK state machine, --sun-misc-unsafe-memory-access for netty.
  applicationDefaultJvmArgs = listOf("--enable-native-access=ALL-UNNAMED", "--sun-misc-unsafe-memory-access=allow")
}

tasks.named<Test>("test") {
  useJUnitPlatform()
  // Java 25 warnings: --enable-native-access for the Restate SDK state machine, --sun-misc-unsafe-memory-access for netty.
  jvmArgs("--enable-native-access=ALL-UNNAMED", "--sun-misc-unsafe-memory-access=allow")
}
