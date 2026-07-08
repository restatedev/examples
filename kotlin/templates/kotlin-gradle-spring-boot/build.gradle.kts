plugins {
  kotlin("jvm") version "2.4.0"
  kotlin("plugin.spring") version "2.4.0"
  kotlin("plugin.serialization") version "2.4.0"

	id("org.springframework.boot") version "3.5.6"
	id("io.spring.dependency-management") version "1.1.7"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(25)
	}
}

repositories {
	mavenCentral()
}

val restateVersion = "2.9.0"

dependencies {
	// Restate SDK (the Spring Boot Kotlin starter also applies the all-open plugin for Restate annotations)
	implementation("dev.restate:sdk-spring-boot-kotlin-starter:$restateVersion")

	// Testing
	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testImplementation("dev.restate:sdk-testing:$restateVersion")
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
	testImplementation("org.jetbrains.kotlin:kotlin-test-junit5")
	testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}

kotlin {
	compilerOptions {
		freeCompilerArgs.addAll("-Xjsr305=strict")
	}
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
