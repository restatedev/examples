plugins {
  application
  kotlin("jvm") version "2.1.20"
  kotlin("plugin.serialization") version "2.1.20"
  id("com.diffplug.spotless") version "6.25.0"
}

subprojects {
  apply(plugin = "kotlin")
  apply(plugin = "org.jetbrains.kotlin.plugin.serialization")
  apply(plugin = "com.diffplug.spotless")

  dependencies {
    implementation("org.apache.logging.log4j:log4j-api:2.24.1")
  }

  kotlin {
    jvmToolchain(17)
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
  }
}