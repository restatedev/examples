import java.net.URI

plugins {
    java
    application
    id ("com.google.cloud.tools.jib") version "3.5.3"
}

repositories {
    mavenCentral()
}

val restateVersion = "2.9.1"

dependencies {
    // Kafka
    implementation("org.apache.kafka:kafka-clients:3.6.1")

    implementation("dev.restate:client:$restateVersion")

    implementation("com.fasterxml.jackson.core:jackson-core:2.15.2")
    implementation("com.fasterxml.jackson.core:jackson-databind:2.15.2")

    implementation("org.apache.logging.log4j:log4j-api:2.24.1")
}


// Set main class
application {
    mainClass.set("dev.restate.sdk.examples.RestaurantMain")
    // Java 25 warnings: --enable-native-access for the Restate SDK state machine, --sun-misc-unsafe-memory-access for netty.
    applicationDefaultJvmArgs = listOf("--enable-native-access=ALL-UNNAMED", "--sun-misc-unsafe-memory-access=allow")
}

tasks.named<Test>("test") {
    useJUnitPlatform()
    // Java 25 warnings: --enable-native-access for the Restate SDK state machine, --sun-misc-unsafe-memory-access for netty.
    jvmArgs("--enable-native-access=ALL-UNNAMED", "--sun-misc-unsafe-memory-access=allow")
}


jib {
    to.image = "restaurant-app:1.0.0"
    container.mainClass  = "dev.restate.sdk.examples.RestaurantMain"
}