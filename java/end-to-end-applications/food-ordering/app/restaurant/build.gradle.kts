import java.net.URI

plugins {
    java
    application
    id ("com.google.cloud.tools.jib") version "3.4.0"
}

repositories {
    mavenCentral()
}

val restateVersion = "2.0.0"

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
}


jib {
    to.image = "restaurant-app:1.0.0"
    container.mainClass  = "dev.restate.sdk.examples.RestaurantMain"
}