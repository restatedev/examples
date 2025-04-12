package org.acme;

import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;
import io.quarkus.runtime.StartupEvent;
import io.vertx.mutiny.core.Vertx;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;

@ApplicationScoped
public class RestateDeployer {

    public void init(@Observes StartupEvent e, Vertx vertx, Greeter greeterSvc) {
        // Start the restate server
        RestateHttpServer
                .fromEndpoint(vertx.getDelegate(),
                        // Bind the greeter service
                        Endpoint.bind(greeterSvc))
                // Starts on 9080
                .listen(9080);
    }
}