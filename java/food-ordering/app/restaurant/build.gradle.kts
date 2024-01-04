plugins {
    java
    application
    id ("com.google.cloud.tools.jib") version "3.4.0"
}

repositories {
    mavenCentral()
}

val restateVersion = "0.6.0"

dependencies {
    //Kafka
    implementation("org.apache.kafka:kafka-clients:3.0.0")

    //Jackson
    implementation("com.fasterxml.jackson.core:jackson-core:2.15.2")
    implementation("com.fasterxml.jackson.core:jackson-databind:2.15.2")

    // Logging (optional)
    implementation("org.apache.logging.log4j:log4j-core:2.20.0")

    // Testing (optional)
    testImplementation("org.junit.jupiter:junit-jupiter:5.9.1")
    testImplementation("dev.restate:sdk-testing:$restateVersion")
}


// Set main class
application {
    mainClass.set("dev.restate.sdk.examples.RestaurantMain")
}


jib {
    to.image = "restaurant-app:0.0.1"
    container.mainClass  = "dev.restate.sdk.examples.RestaurantMain"
}