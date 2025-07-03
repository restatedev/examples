plugins {
  java
}

repositories {
  mavenCentral()
}

val restateVersion = "2.2.0"

dependencies {
  // Annotation processor
  annotationProcessor("dev.restate:sdk-api-gen:$restateVersion")

  // Restate SDK
  implementation("dev.restate:sdk-java-lambda:$restateVersion")

  testImplementation(platform("org.junit:junit-bom:5.11.3"))
  testImplementation("org.junit.jupiter:junit-jupiter")
  testImplementation("dev.restate:sdk-testing:$restateVersion")

  // AWS Lambda-specific logging, see https://docs.aws.amazon.com/lambda/latest/dg/java-logging.html#java-logging-log4j2
  val log4j2version = "2.24.2"
  implementation("org.apache.logging.log4j:log4j-core:$log4j2version")
  implementation("org.apache.logging.log4j:log4j-layout-template-json:$log4j2version")
  implementation("com.amazonaws:aws-lambda-java-log4j2:1.6.0")
}

// Setup Java compiler target
java {
  toolchain {
    languageVersion.set(JavaLanguageVersion.of(21))
  }
}

tasks.register<Zip>("lambdaZip") {
  from(tasks.compileJava.get())
  from(tasks.processResources.get())

  into("lib") {
    from(configurations.runtimeClasspath)
  }
}

tasks.build {
  dependsOn("lambdaZip")
}
