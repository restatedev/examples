plugins {
	kotlin("jvm") version "2.0.0"
	kotlin("plugin.spring") version "2.0.0"
	kotlin("plugin.serialization") version "2.0.0"
	id("com.google.devtools.ksp") version "2.0.0-1.0.21"

	id("org.springframework.boot") version "3.4.0"
	id("io.spring.dependency-management") version "1.1.6"
}

group = "com.example"
version = "0.0.1-SNAPSHOT"

java {
	toolchain {
		languageVersion = JavaLanguageVersion.of(17)
	}
}

repositories {
	mavenLocal()
	mavenCentral()
}

val restateVersion = "1.3.0-SNAPSHOT"

dependencies {
	// Annotation processor
	ksp("dev.restate:sdk-api-kotlin-gen:$restateVersion")

	implementation("org.springframework.boot:spring-boot-starter")
	implementation("org.springframework.boot:spring-boot-starter-web")
	implementation("dev.restate:sdk-spring-boot-kotlin-starter:$restateVersion")
	implementation("org.jetbrains.kotlin:kotlin-reflect")

	testImplementation("org.springframework.boot:spring-boot-starter-test")
	testImplementation("dev.restate:sdk-testing:$restateVersion")
	// This is needed for tests using coroutines
	implementation("org.jetbrains.kotlinx:kotlinx-coroutines-test:1.9.0")
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
