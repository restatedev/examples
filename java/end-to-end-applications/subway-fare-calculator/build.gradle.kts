plugins {
  java
  application
}

repositories {
  mavenCentral()
}

val restateVersion = "2.9.0"

dependencies {
  implementation("dev.restate:sdk-java-http:$restateVersion")
}

// Set main class
application {
  mainClass.set("dev.restate.example.CardTracker")
  // Java 25 warnings: --enable-native-access for the Restate SDK state machine, --sun-misc-unsafe-memory-access for netty.
  applicationDefaultJvmArgs = listOf("--enable-native-access=ALL-UNNAMED", "--sun-misc-unsafe-memory-access=allow")
}

java {
  toolchain {
    languageVersion.set(JavaLanguageVersion.of(25))
  }
}

tasks.named<Test>("test") {
  useJUnitPlatform()
  // Java 25 warnings: --enable-native-access for the Restate SDK state machine, --sun-misc-unsafe-memory-access for netty.
  jvmArgs("--enable-native-access=ALL-UNNAMED", "--sun-misc-unsafe-memory-access=allow")
}
