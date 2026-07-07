plugins {
  application
  kotlin("jvm") version "2.4.0"
  kotlin("plugin.serialization") version "2.4.0"
  // Restate proxy clients need non-final classes; the all-open plugin opens
  // classes annotated with the Restate annotations (see allOpen block below).
  kotlin("plugin.allopen") version "2.4.0"
}

repositories {
  mavenCentral()
}

val restateVersion = "2.9.0"

dependencies {
  // Restate SDK
  implementation("dev.restate:sdk-kotlin-http:$restateVersion")
  implementation("org.apache.logging.log4j:log4j-api:2.24.1")
}

kotlin {
  jvmToolchain(25)
}

allOpen {
  annotation("dev.restate.sdk.annotation.Service")
  annotation("dev.restate.sdk.annotation.VirtualObject")
  annotation("dev.restate.sdk.annotation.Workflow")
}

// Set main class
application {
  if (project.hasProperty("mainClass")) {
    mainClass.set(project.property("mainClass") as String)
  } else {
    mainClass.set("durable_execution.RoleUpdateServiceKt")
  }
  // Java 25 warnings: --enable-native-access for the Restate SDK state machine, --sun-misc-unsafe-memory-access for netty.
  applicationDefaultJvmArgs = listOf("--enable-native-access=ALL-UNNAMED", "--sun-misc-unsafe-memory-access=allow")
}
