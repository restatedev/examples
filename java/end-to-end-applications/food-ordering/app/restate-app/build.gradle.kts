import java.net.URI

plugins {
    java
    application
    id ("com.google.cloud.tools.jib") version "3.4.0"
    id("com.diffplug.spotless") version "6.25.0"
}

repositories {
    mavenCentral()
}

val restateVersion = "2.2.0"

dependencies {
    // Restate SDK
    annotationProcessor("dev.restate:sdk-api-gen:$restateVersion")

    implementation("dev.restate:sdk-java-http:$restateVersion")

    // Jackson parameter names
    // https://github.com/FasterXML/jackson-modules-java8/tree/2.14/parameter-names
    implementation("com.fasterxml.jackson.module:jackson-module-parameter-names:2.16.1")
    // Jackson java8 types
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jdk8:2.16.1")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.16.1")

    // Kafka
    implementation("org.apache.kafka:kafka-clients:3.6.1")

    // Logging
    implementation("org.apache.logging.log4j:log4j-api:2.24.1")
}

// Set main class
application {
    mainClass.set("dev.restate.sdk.examples.AppMain")
}

jib {
    to.image = "delivery-service:1.0.0"
    container.mainClass  = "dev.restate.sdk.examples.AppMain"
}

tasks.withType<JavaCompile> {
    // Using -parameters allows to use Jackson ParameterName feature
    // https://github.com/FasterXML/jackson-modules-java8/tree/2.14/parameter-names
    options.compilerArgs.add("-parameters")
}

// Code formatting tool
spotless {
    isEnforceCheck = false
    java {
        importOrder()
        removeUnusedImports()
        googleJavaFormat()
        formatAnnotations()
    }
}