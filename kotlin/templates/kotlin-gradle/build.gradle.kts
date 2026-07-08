plugins {
  application
  kotlin("jvm") version "2.4.0"
  kotlin("plugin.serialization") version "2.4.0"
  kotlin("plugin.allopen") version "2.4.0"
}

repositories {
  mavenCentral()
}

val restateVersion = "2.9.0"

dependencies {
  // Restate SDK
  implementation("dev.restate:sdk-kotlin-http:$restateVersion")

  // Logging
  implementation("org.apache.logging.log4j:log4j-api:2.24.3")
}

kotlin {
  jvmToolchain(25)
}

allOpen {
  // Restate proxy clients need non-final classes.
  annotation("dev.restate.sdk.annotation.Service")
  annotation("dev.restate.sdk.annotation.VirtualObject")
  annotation("dev.restate.sdk.annotation.Workflow")
}

// Configure main class
application {
  mainClass.set("my.example.GreeterKt")
  // Java 25 warnings: --enable-native-access for the Restate SDK state machine, --sun-misc-unsafe-memory-access for netty.
  applicationDefaultJvmArgs = listOf("--enable-native-access=ALL-UNNAMED", "--sun-misc-unsafe-memory-access=allow")
}
