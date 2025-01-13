package org.acme;

import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import io.quarkus.runtime.StartupEvent;
import io.vertx.mutiny.core.Vertx;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;

@ApplicationScoped
public class RestateDeployer {

    public void init(@Observes StartupEvent e, Vertx vertx, Greeter greeterSvc) {
        // Start the restate server
        RestateHttpEndpointBuilder
                .builder(vertx.getDelegate())
                // Bind the greeter service
                .bind(greeterSvc)
                // Starts on port defined with env variable PORT, or default 9080
                .buildAndListen();
    }
}