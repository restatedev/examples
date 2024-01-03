plugins {
  java
  application

  id("com.diffplug.spotless").version("6.6.1")
}

repositories {
  mavenCentral()
}

// Configure test platform
tasks.withType<Test> {
  useJUnitPlatform()
}


allprojects {
  apply(plugin = "com.diffplug.spotless")
  configure<com.diffplug.gradle.spotless.SpotlessExtension> {
    java {
      googleJavaFormat()
      targetExclude("build/generated/**/*.java")
    }
  }
}