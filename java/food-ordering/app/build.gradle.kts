plugins {
  java
  application

}

repositories {
  mavenCentral()
}

// Configure test platform
tasks.withType<Test> {
  useJUnitPlatform()
}


