plugins {
  application
  kotlin("jvm") version "2.4.0"
  kotlin("plugin.serialization") version "2.4.0"
  kotlin("plugin.allopen") version "2.4.0"
  id("com.diffplug.spotless") version "8.8.0"
}

repositories {
  mavenCentral()
}

val restateVersion = "2.9.2"

dependencies {
  // Restate SDK
  implementation("dev.restate:sdk-kotlin-http:$restateVersion")

  // Logging
  implementation("org.apache.logging.log4j:log4j-api:2.24.1")

  // Kotlinx serialization
  implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.7.3")
}

kotlin { jvmToolchain(25) }

allOpen {
  // Restate proxy clients need non-final classes.
  annotation("dev.restate.sdk.annotation.Service")
  annotation("dev.restate.sdk.annotation.VirtualObject")
  annotation("dev.restate.sdk.annotation.Workflow")
}

// Configure main class
application {
  if (project.hasProperty("mainClass")) {
    mainClass.set(project.property("mainClass") as String)
  } else {
    mainClass.set("my.example.sagas.BookingWorkflowKt")
  }
  // Java 25 warnings: --enable-native-access for the Restate SDK state machine,
  // --sun-misc-unsafe-memory-access for netty.
  applicationDefaultJvmArgs =
      listOf("--enable-native-access=ALL-UNNAMED", "--sun-misc-unsafe-memory-access=allow")
}

spotless {
  kotlin {
    targetExclude("build/generated/**/*.kt")
    ktfmt()
  }
  kotlinGradle { ktfmt() }
}
