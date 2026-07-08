plugins {
  application
  kotlin("jvm") version "2.4.0"
  kotlin("plugin.serialization") version "2.4.0"
  // Restate proxy clients need non-final classes; the all-open plugin opens
  // classes annotated with the Restate annotations (see allOpen block below).
  kotlin("plugin.allopen") version "2.4.0"
  id("com.diffplug.spotless") version "8.8.0"
}

subprojects {
  apply(plugin = "kotlin")
  apply(plugin = "org.jetbrains.kotlin.plugin.serialization")
  apply(plugin = "org.jetbrains.kotlin.plugin.allopen")
  apply(plugin = "com.diffplug.spotless")

  dependencies {
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

  // Code formatting tool
  spotless {
    isEnforceCheck = false
    kotlin {
      targetExclude("build/generated/**/*.kt")
      ktfmt()
    }
    kotlinGradle { ktfmt() }
  }

  tasks.withType<Test> {
    useJUnitPlatform()
    // Java 25 warnings: --enable-native-access for the Restate SDK state machine, --sun-misc-unsafe-memory-access for netty.
    jvmArgs("--enable-native-access=ALL-UNNAMED", "--sun-misc-unsafe-memory-access=allow")
  }
}