package com.example.restatestarter

import dev.restate.sdk.springboot.EnableRestate
import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
@EnableRestate
class DemoApplication

fun main(args: Array<String>) {
	runApplication<DemoApplication>(*args)
}
