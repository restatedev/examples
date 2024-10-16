plugins {
	java
    application
	id("org.springframework.boot") version "3.3.1"
	id("io.spring.dependency-management") version "1.1.5"
	id("com.diffplug.spotless") version "6.25.0"
}

group = "dev.restate.examples"
version = "0.0.1-SNAPSHOT"

val restateVersion = "1.1.1"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(17)
	}
}

repositories {
	mavenCentral()
}

dependencies {
	implementation("org.springframework.boot:spring-boot-starter")
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")

	annotationProcessor("dev.restate:sdk-api-gen:$restateVersion")

	implementation("org.springframework.boot", "spring-boot-starter-data-jpa")

	// Restate SDK
	implementation("dev.restate:sdk-api:$restateVersion")
	implementation("dev.restate:sdk-http-vertx:$restateVersion")
	// To use Jackson to read/write state entries (optional)
	implementation("dev.restate:sdk-serde-jackson:$restateVersion")

	implementation("org.postgresql", "postgresql")

	// Logging (optional)
	implementation("org.apache.logging.log4j:log4j-core:2.20.0")
}

// Set main class
application {
	mainClass.set("dev.restate.examples.AppMain")
}

tasks.withType<Test> {
	useJUnitPlatform()
}

spotless {
	isEnforceCheck = false
	java {
		googleJavaFormat()
		importOrder()
		removeUnusedImports()
		formatAnnotations()
		toggleOffOn("//", "/n")
	}
}