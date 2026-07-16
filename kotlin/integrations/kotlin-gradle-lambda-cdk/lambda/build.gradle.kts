plugins {
  kotlin("jvm") version "2.4.0"
  kotlin("plugin.serialization") version "2.4.0"
  kotlin("plugin.allopen") version "2.4.0"

  id("distribution")
}

repositories {
  mavenCentral()
}

val restateVersion = "2.9.2"

// Restate proxy clients require non-final annotated classes
allOpen {
  annotation("dev.restate.sdk.annotation.Service")
  annotation("dev.restate.sdk.annotation.VirtualObject")
  annotation("dev.restate.sdk.annotation.Workflow")
}

dependencies {
  // Restate SDK
  implementation("dev.restate:sdk-kotlin-lambda:$restateVersion")

  // AWS Lambda-specific logging, see https://docs.aws.amazon.com/lambda/latest/dg/java-logging.html#java-logging-log4j2
  val log4j2version = "2.23.1"
  implementation("org.apache.logging.log4j:log4j-core:$log4j2version")
  implementation("org.apache.logging.log4j:log4j-layout-template-json:$log4j2version")
  implementation("com.amazonaws:aws-lambda-java-log4j2:1.6.0")
}

// Setup Java/Kotlin compiler target
kotlin {
  jvmToolchain(25)
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
