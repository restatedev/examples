plugins {
  java
  application
  id("com.diffplug.spotless") version "6.25.0"
}

repositories {
  mavenCentral()
}

val restateVersion = "2.4.0"

dependencies {
  annotationProcessor("dev.restate:sdk-api-gen:$restateVersion")

  // Restate SDK
  implementation("dev.restate:sdk-java-http:$restateVersion")
  implementation("dev.restate:client:${restateVersion}")

  // Logging
  implementation("org.apache.logging.log4j:log4j-api:2.24.1")
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
    mainClass.set("my.example.AppMain")
  }
}

spotless {
  java {
    googleJavaFormat()
    importOrder()
    removeUnusedImports()
    formatAnnotations()
    toggleOffOn("//", "/n")
  }
}