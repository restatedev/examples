plugins {
	java
	application
	id("org.springframework.boot") version "3.3.1"
	id("io.spring.dependency-management") version "1.1.5"
	id("com.diffplug.spotless") version "8.8.0"
}

group = "dev.restate.examples"
version = "0.0.1-SNAPSHOT"

repositories {
	mavenCentral()
}

val restateVersion = "2.9.0"

dependencies {
	implementation("org.springframework.boot:spring-boot-starter")
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")

	implementation("org.springframework.boot", "spring-boot-starter-data-jpa")

	// Restate SDK
	implementation("dev.restate:sdk-spring-boot-starter:$restateVersion")

	implementation("org.postgresql", "postgresql")

	// Logging (optional)
	implementation("org.apache.logging.log4j:log4j-core:2.24.1")
}

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(25)
	}
}

// Set main class
application {
	mainClass.set("dev.restate.examples.AppMain")
}

tasks.withType<Test> {
	useJUnitPlatform()
	// Java 25 warnings: --enable-native-access for the Restate SDK state machine, --sun-misc-unsafe-memory-access for netty.
	jvmArgs("--enable-native-access=ALL-UNNAMED", "--sun-misc-unsafe-memory-access=allow")
}

tasks.named<org.springframework.boot.gradle.tasks.run.BootRun>("bootRun") {
	// Java 25 warnings: --enable-native-access for the Restate SDK state machine, --sun-misc-unsafe-memory-access for netty.
	jvmArgs("--enable-native-access=ALL-UNNAMED", "--sun-misc-unsafe-memory-access=allow")
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