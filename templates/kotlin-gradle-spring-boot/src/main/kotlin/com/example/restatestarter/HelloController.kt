package com.example.restatestarter

import dev.restate.sdk.client.Client
import org.springframework.web.bind.annotation.GetMapping
import org.springframework.web.bind.annotation.RestController

// Example how ot use the restate client within your REST Controllers

@RestController
class HelloController(private val restateClient: Client) {

  @GetMapping("/")
  suspend fun index(): String {
    return GreeterClient.fromClient(restateClient).greet("Francesco") + " from Spring Boot!"
  }
}