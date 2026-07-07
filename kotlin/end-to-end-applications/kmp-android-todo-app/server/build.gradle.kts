plugins {
    alias(libs.plugins.kotlinJvm)
    application

    // Restate proxy clients need non-final classes; the all-open plugin opens
    // classes annotated with the Restate annotations (see allOpen block below).
    id("org.jetbrains.kotlin.plugin.allopen") version "2.4.0"
}

group = "dev.restate.examples.noteapp"
version = "1.0.0"

val restateVersion = "2.9.0"

kotlin {
    jvmToolchain(25)
}

allOpen {
    annotation("dev.restate.sdk.annotation.Service")
    annotation("dev.restate.sdk.annotation.VirtualObject")
    annotation("dev.restate.sdk.annotation.Workflow")
}

dependencies {
    implementation(projects.shared)

    // Restate SDK
    implementation("dev.restate:sdk-kotlin-http:$restateVersion")

    implementation("org.apache.logging.log4j:log4j-core:2.24.1")
}

application {
    mainClass.set("dev.restate.examples.noteapp.ApplicationKt")
    // Java 25 warnings: --enable-native-access for the Restate SDK state machine, --sun-misc-unsafe-memory-access for netty.
    applicationDefaultJvmArgs = listOf("--enable-native-access=ALL-UNNAMED", "--sun-misc-unsafe-memory-access=allow")
}