package com.example.restatestarter;

import dev.restate.sdk.springboot.EnableRestate;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
@EnableRestate
public class RestateStarterApplication {

	public static void main(String[] args) {
		SpringApplication.run(RestateStarterApplication.class, args);
	}

}
