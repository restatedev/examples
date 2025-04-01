plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version("0.8.0")
}

rootProject.name = "food-ordering-app"
include("restaurant", "restate-app")

dependencyResolutionManagement {
    repositories {
        mavenCentral()
    }
}