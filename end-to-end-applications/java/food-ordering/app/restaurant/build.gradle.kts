import java.net.URI

plugins {
    java
    application
    id ("com.google.cloud.tools.jib") version "3.4.0"
}

repositories {
    mavenCentral()
}

val restateVersion = "1.0.0"

dependencies {
    // Kafka
    implementation("org.apache.kafka:kafka-clients:3.6.1")

    // SDK common (contains the restate http client)
    implementation("dev.restate:sdk-common:$restateVersion")

    // Jackson
    implementation("com.fasterxml.jackson.core:jackson-core:2.15.2")
    implementation("com.fasterxml.jackson.core:jackson-databind:2.15.2")

    // Logging (optional)
    implementation("org.apache.logging.log4j:log4j-core:2.20.0")
}


// Set main class
application {
    mainClass.set("dev.restate.sdk.examples.RestaurantMain")
}


jib {
    to.image = "restaurant-app:0.0.1"
    container.mainClass  = "dev.restate.sdk.examples.RestaurantMain"
}