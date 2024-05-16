import org.jetbrains.kotlin.gradle.dsl.kotlinExtension

plugins {
  application
  kotlin("jvm") version "1.9.22"
  kotlin("plugin.serialization") version "1.9.22"
  id("com.diffplug.spotless") version "6.25.0"
}

subprojects {
  apply(plugin = "kotlin")
  apply(plugin = "org.jetbrains.kotlin.plugin.serialization")
  apply(plugin = "com.diffplug.spotless")

  dependencies {
    implementation("org.apache.logging.log4j:log4j-core:2.20.0")
    implementation("org.jetbrains.kotlinx:kotlinx-serialization-json:1.6.0")
  }

  kotlin {
    jvmToolchain(17)
  }

  // Code formatting tool
  spotless {
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