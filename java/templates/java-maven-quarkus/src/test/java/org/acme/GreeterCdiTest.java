package org.acme;

import dev.restate.client.Client;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.testing.RestateRunner;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

@QuarkusTest
public class GreeterCdiTest {

    @Inject
    Greeter greeter;

    static RestateRunner restateRunner;

    @BeforeEach
    void beforeEach() {
        if (restateRunner == null) {
            restateRunner = RestateRunner.from(Endpoint.builder().bind(greeter).build()).build();
            restateRunner.start();
        }
    }

    @AfterAll
    static void afterAll() {
        if (restateRunner != null && restateRunner.getRestateContainer().isRunning()) {
            restateRunner.stop();
        }
    }

    @Test
    void test() {
        var ingressClient = Client.connect(restateRunner.getRestateUrl().toString());
        var c = GreeterClient.fromClient(ingressClient);
        var response = c.greet(new Greeter.Greeting("John Doe"));
        assertEquals("You said hi to John Doe!", response.message());
    }
}
