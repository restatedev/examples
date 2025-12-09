plugins {
    alias(libs.plugins.kotlinJvm)
    application

    id("com.google.devtools.ksp") version "2.2.10-2.0.2"
}

group = "dev.restate.examples.noteapp"
version = "1.0.0"

val restateVersion = "2.4.2"

kotlin {
    jvmToolchain(17)
}

dependencies {
    implementation(projects.shared)

    // Annotation processor
    ksp("dev.restate:sdk-api-kotlin-gen:$restateVersion")

    // Restate SDK
    implementation("dev.restate:sdk-kotlin-http:$restateVersion")

    implementation("org.apache.logging.log4j:log4j-core:2.24.1")
}

application {
    mainClass.set("dev.restate.examples.noteapp.ApplicationKt")
}