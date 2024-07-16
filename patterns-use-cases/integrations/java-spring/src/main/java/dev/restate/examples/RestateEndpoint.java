package dev.restate.examples;

import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

@Component
public class RestateEndpoint implements ApplicationRunner {

    @Autowired
    private ProductService productService;

    @Override
    public void run(ApplicationArguments args) throws Exception {
        RestateHttpEndpointBuilder.builder()
                .bind(productService)
                .buildAndListen();
    }
}
