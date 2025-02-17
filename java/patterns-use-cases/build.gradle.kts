plugins {
  java
  application
}

repositories {
  mavenCentral()
}

val restateVersion = "1.2.0"

dependencies {
  annotationProcessor("dev.restate:sdk-api-gen:$restateVersion")

  // Restate SDK
  implementation("dev.restate:sdk-api:$restateVersion")
  implementation("dev.restate:sdk-http-vertx:$restateVersion")
  // To use Jackson to read/write state entries (optional)
  implementation("dev.restate:sdk-serde-jackson:$restateVersion")

  // Jackson parameter names
  // https://github.com/FasterXML/jackson-modules-java8/tree/2.14/parameter-names
  implementation("com.fasterxml.jackson.module:jackson-module-parameter-names:2.16.1")
  // Jackson java8 types
  implementation("com.fasterxml.jackson.datatype:jackson-datatype-jdk8:2.16.1")
  implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.16.1")

  // Stripe
  implementation("com.stripe:stripe-java:25.7.0")
  implementation("com.google.code.gson:gson:2.10.1")

  // Logging (optional)
  implementation("org.apache.logging.log4j:log4j-core:2.24.1")
}

// Set main class
application {
  if (project.hasProperty("mainClass")) {
    mainClass.set(project.property("mainClass") as String)
  } else {
    mainClass.set("my.example.dataupload.DataUploadService")
  }
}

tasks.withType<JavaCompile> {
  // Using -parameters allows to use Jackson ParameterName feature
  // https://github.com/FasterXML/jackson-modules-java8/tree/2.14/parameter-names
  options.compilerArgs.add("-parameters")
}

tasks.named<Test>("test") {
  useJUnitPlatform()
}

java {
  toolchain {
    languageVersion.set(JavaLanguageVersion.of(17))
  }
}