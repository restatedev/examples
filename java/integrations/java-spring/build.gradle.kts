plugins {
	java
	application
	id("org.springframework.boot") version "3.3.1"
	id("io.spring.dependency-management") version "1.1.5"
	id("com.diffplug.spotless") version "6.25.0"
}

group = "dev.restate.examples"
version = "0.0.1-SNAPSHOT"

repositories {
	mavenCentral()
}

val restateVersion = "2.0.0"

dependencies {
	implementation("org.springframework.boot:spring-boot-starter")
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")

	annotationProcessor("dev.restate:sdk-api-gen:$restateVersion")

	implementation("org.springframework.boot", "spring-boot-starter-data-jpa")

	// Restate SDK
	implementation("dev.restate:sdk-spring-boot-starter:$restateVersion")

	implementation("org.postgresql", "postgresql")

	// Logging (optional)
	implementation("org.apache.logging.log4j:log4j-core:2.24.1")
}

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(21)
	}
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