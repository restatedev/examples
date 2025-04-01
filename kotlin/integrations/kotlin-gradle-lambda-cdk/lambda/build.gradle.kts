import java.net.URI

plugins {
  kotlin("jvm") version "2.0.0"
  // Kotlinx serialization (optional)
  kotlin("plugin.serialization") version "2.0.0"

  id("com.google.devtools.ksp") version "2.0.0-1.0.21"

  id("distribution")
}

repositories {
  mavenCentral()
}

val restateVersion = "2.0.0"

dependencies {
  // Annotation processor
  ksp("dev.restate:sdk-api-kotlin-gen:$restateVersion")

  // Restate SDK
  implementation("dev.restate:sdk-api-kotlin:$restateVersion")
  implementation("dev.restate:sdk-lambda:$restateVersion")

  // AWS Lambda-specific logging, see https://docs.aws.amazon.com/lambda/latest/dg/java-logging.html#java-logging-log4j2
  val log4j2version = "2.23.1"
  implementation("org.apache.logging.log4j:log4j-core:$log4j2version")
  implementation("org.apache.logging.log4j:log4j-layout-template-json:$log4j2version")
  implementation("com.amazonaws:aws-lambda-java-log4j2:1.6.0")
}

// Setup Java/Kotlin compiler target
java {
  toolchain {
    languageVersion.set(JavaLanguageVersion.of(21))
  }
}

tasks.register<Zip>("lambdaZip") {
  from(tasks.compileKotlin.get())
  from(tasks.processResources.get())

  into("lib") {
    from(configurations.runtimeClasspath)
  }
}

tasks.build {
  dependsOn("lambdaZip")
}