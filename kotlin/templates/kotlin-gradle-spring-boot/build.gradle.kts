plugins {
  kotlin("jvm") version "2.2.10"
  kotlin("plugin.spring") version "2.2.10"
  kotlin("plugin.serialization") version "2.2.10"
  id("com.google.devtools.ksp") version "2.2.10-2.0.2"

	id("org.springframework.boot") version "3.4.4"
	id("io.spring.dependency-management") version "1.1.7"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(17)
	}
}

repositories {
	mavenCentral()
}

val restateVersion = "2.3.0"

dependencies {
	// Annotation processor
	ksp("dev.restate:sdk-api-kotlin-gen:$restateVersion")

	// Restate SDK
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
}
