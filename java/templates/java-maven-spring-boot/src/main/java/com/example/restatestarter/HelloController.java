package com.example.restatestarter;

import com.example.restatestarter.Greeter.Greeting;
import dev.restate.client.Client;
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
		return GreeterClient.fromClient(restateClient).greet(new Greeting("Alice")) + " from Spring Boot!";
	}

}