package com.example.demo;

import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class RestateEndpoint implements ApplicationRunner {

    @Autowired private Greeter greeter;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        RestateHttpEndpointBuilder.builder().bind(greeter).buildAndListen();
    }
}