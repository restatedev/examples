plugins {
  java
  application
}

repositories {
  mavenCentral()
}

val restateVersion = "2.2.0"

dependencies {
  annotationProcessor("dev.restate:sdk-api-gen:$restateVersion")
  implementation("dev.restate:sdk-java-http:$restateVersion")
}

// Set main class
application {
  mainClass.set("dev.restate.example.CardTracker")
}

java {
  toolchain {
    languageVersion.set(JavaLanguageVersion.of(17))
  }
}