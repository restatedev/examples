package com.example.demo;

import dev.restate.sdk.Context;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.Service;
import org.springframework.stereotype.Component;

@Component
@Service
public class Greeter {

    @Handler
    public String greet(Context ctx, String greeting) {
        return greeting;
    }
}
