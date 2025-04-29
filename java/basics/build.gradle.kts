plugins {
  java
  application
}

repositories {
  mavenCentral()
}

val restateVersion = "2.1.0"

dependencies {
  annotationProcessor("dev.restate:sdk-api-gen:$restateVersion")

  // Restate SDK
  implementation("dev.restate:sdk-java-http:$restateVersion")

  implementation("org.apache.logging.log4j:log4j-api:2.24.1")

  // Jackson parameter names
  // https://github.com/FasterXML/jackson-modules-java8/tree/2.14/parameter-names
  implementation("com.fasterxml.jackson.module:jackson-module-parameter-names:2.16.1")
  // Jackson java8 types
  implementation("com.fasterxml.jackson.datatype:jackson-datatype-jdk8:2.16.1")
  implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.16.1")
}

java {
  toolchain {
    languageVersion.set(JavaLanguageVersion.of(17))
  }
}

// Set main class
application {
  if (project.hasProperty("mainClass")) {
    mainClass.set(project.property("mainClass") as String)
  } else {
    mainClass.set("durable_execution.RoleUpdateService")
  }
}

tasks.withType<JavaCompile> {
  // Using -parameters allows to use Jackson ParameterName feature
  // https://github.com/FasterXML/jackson-modules-java8/tree/2.14/parameter-names
  options.compilerArgs.add("-parameters")
}