plugins {
    java
    application
}

repositories {
    mavenCentral()
}

dependencies {
    // Restate SDK
    implementation("dev.restate:sdk-java-http:2.3.0")
    
    // Code generator for service clients
    annotationProcessor("dev.restate:sdk-api-gen:2.3.0")
    
    // Logging
    implementation("org.apache.logging.log4j:log4j-core:2.24.2")
}

application {
    mainClass.set("com.example.workflows.WorkflowsApplication")
}

tasks.register<JavaExec>("runClient") {
    classpath = sourceSets.main.get().runtimeClasspath
    mainClass.set("com.example.workflows.Client")
}

java {
    toolchain {
        languageVersion.set(JavaLanguageVersion.of(11))
    }
}

tasks.compileJava {
    options.compilerArgs.add("-parameters")
}