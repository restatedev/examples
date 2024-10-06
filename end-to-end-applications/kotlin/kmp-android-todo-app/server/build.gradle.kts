plugins {
    alias(libs.plugins.kotlinJvm)
    application

    id("com.google.devtools.ksp") version "2.0.20-1.0.25"
}

group = "dev.restate.examples.noteapp"
version = "1.0.0"

val restateVersion = "1.1.0"

kotlin {
    jvmToolchain(11)
}

dependencies {
    implementation(projects.shared)

    // Annotation processor
    ksp("dev.restate:sdk-api-kotlin-gen:$restateVersion")

    // Restate SDK
    implementation("dev.restate:sdk-api-kotlin:$restateVersion")
    implementation("dev.restate:sdk-http-vertx:$restateVersion")

    implementation("org.apache.logging.log4j:log4j-core:2.23.0")
}

application {
    mainClass.set("dev.restate.examples.noteapp.ApplicationKt")
}