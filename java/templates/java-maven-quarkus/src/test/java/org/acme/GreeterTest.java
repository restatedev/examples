package org.acme;

import dev.restate.client.Client;
import dev.restate.sdk.testing.BindService;
import dev.restate.sdk.testing.RestateClient;
import dev.restate.sdk.testing.RestateTest;
import org.acme.Greeter.GreetingResponse;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

@RestateTest
public class GreeterTest {

    @BindService
    Greeter greeter = new Greeter();

    @Test
    void test(@RestateClient Client ingressClient) {
        GreeterClient.IngressClient c = GreeterClient.fromClient(ingressClient);
        GreetingResponse response = c.greet(new Greeter.Greeting("John Doe"));
        assertEquals("You said hi to John Doe!", response.message());
    }
}
