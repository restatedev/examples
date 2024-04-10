import java.net.URI

plugins {
    java
    application
    id ("com.google.cloud.tools.jib") version "3.4.0"
    id("com.diffplug.spotless") version "6.25.0"
}

repositories {
    maven {
        url = URI.create("https://s01.oss.sonatype.org/content/repositories/snapshots/")
    }
    mavenCentral()
}

val restateVersion = "0.9.0-SNAPSHOT"

dependencies {
    // Restate SDK
    annotationProcessor("dev.restate:sdk-api-gen:$restateVersion")
    implementation("dev.restate:sdk-api:$restateVersion")
    implementation("dev.restate:sdk-http-vertx:$restateVersion")
    implementation("dev.restate:sdk-serde-jackson:$restateVersion")

    // Jackson parameter names
    // https://github.com/FasterXML/jackson-modules-java8/tree/2.14/parameter-names
    implementation("com.fasterxml.jackson.module:jackson-module-parameter-names:2.16.1")
    // Jackson java8 types
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jdk8:2.16.1")
    implementation("com.fasterxml.jackson.datatype:jackson-datatype-jsr310:2.16.1")

    // Kafka
    implementation("org.apache.kafka:kafka-clients:3.6.1")

    // Logging (optional)
    implementation("org.apache.logging.log4j:log4j-core:2.20.0")
}

// Set main class
application {
    mainClass.set("dev.restate.sdk.examples.AppMain")
}

jib {
    to.image = "restate-app:0.0.1"
    container.mainClass  = "dev.restate.sdk.examples.AppMain"
}

tasks.withType<JavaCompile> {
    // Using -parameters allows to use Jackson ParameterName feature
    // https://github.com/FasterXML/jackson-modules-java8/tree/2.14/parameter-names
    options.compilerArgs.add("-parameters")
}

// Code formatting tool
spotless {
    java {
        importOrder()
        removeUnusedImports()
        googleJavaFormat()
        formatAnnotations()
    }
}