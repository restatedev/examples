plugins {
  java
  application
}

repositories {
  mavenCentral()
}

allprojects {
  apply(plugin = "java")

  java {
    // Configure the java toolchain to use. If not found, it will be downloaded automatically
    toolchain { languageVersion = JavaLanguageVersion.of(17) }
  }
}

// Configure test platform
tasks.withType<Test> {
  useJUnitPlatform()
}