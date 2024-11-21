package com.example.restatestarter;

import dev.restate.sdk.client.Client;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
public class HelloController {

	private final Client restateClient;

    public HelloController(Client restateClient) {
        this.restateClient = restateClient;
    }

    @GetMapping("/")
	public String index() {
		return GreeterClient.fromClient(restateClient).greet("Francesco") + " from Spring Boot!";
	}

}