plugins {
    id("org.gradle.toolchains.foojay-resolver-convention") version("1.0.0")
}

rootProject.name = "food-ordering-app"
include("restaurant", "restate-app")

dependencyResolutionManagement {
    repositories {
        mavenCentral()
    }
}