plugins {
  java
  application
  id("com.diffplug.spotless") version "8.8.0"
}

repositories {
  mavenCentral()
}

val restateVersion = "2.9.1"

dependencies {
  // Restate SDK
  implementation("dev.restate:sdk-java-http:$restateVersion")
  implementation("dev.restate:client:${restateVersion}")

  // Logging
  implementation("org.apache.logging.log4j:log4j-api:2.24.1")
}

java {
  toolchain {
    languageVersion.set(JavaLanguageVersion.of(25))
  }
}

// Set main class
application {
  // Java 25 warnings: --enable-native-access for the Restate SDK state machine, --sun-misc-unsafe-memory-access for netty.
  applicationDefaultJvmArgs = listOf("--enable-native-access=ALL-UNNAMED", "--sun-misc-unsafe-memory-access=allow")
  if (project.hasProperty("mainClass")) {
    mainClass.set(project.property("mainClass") as String)
  } else {
    mainClass.set("my.example.AppMain")
  }
}

tasks.named<Test>("test") {
  useJUnitPlatform()
  // Java 25 warnings: --enable-native-access for the Restate SDK state machine, --sun-misc-unsafe-memory-access for netty.
  jvmArgs("--enable-native-access=ALL-UNNAMED", "--sun-misc-unsafe-memory-access=allow")
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