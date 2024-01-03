package dev.restate.sdk.examples;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpServer;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import dev.restate.sdk.examples.types.RestaurantRequest;
import dev.restate.sdk.serde.jackson.JacksonSerdes;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Optional;

public class RestaurantMain {
    private static final Logger logger = LogManager.getLogger(RestaurantMain.class);

    private static final String RESTATE_RUNTIME_ENDPOINT = "http://localhost:8080";

    public static void main(String[] args) throws IOException {
        HttpServer server = HttpServer.create(new InetSocketAddress(5050), 0);
        server.createContext("/create", new CreateHandler());
        server.createContext("/prepare", new PrepareHandler());
        server.createContext("/cancel", new CancelHandler());

        server.setExecutor(null);
        server.start();
        System.out.println("Restaurant POS server is listening on port 5050...");
    }

    static class CreateHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            String orderId = "";

            logger.info("Creating order " + orderId);
            t.sendResponseHeaders(200, -1);

            logger.info("Order " + orderId + " accepted");
            logger.info("Order " + orderId + " created");

            t.close();
        }
    }

    static class PrepareHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            logger.info("Started preparation");
            ObjectMapper mapper = new ObjectMapper();
            JsonNode node = mapper.readTree(t.getRequestBody());

            logger.info("Started preparation of order " + node.get("orderId").asText() +
                    "; expected duration: 5 seconds");

            logger.info("Order " + node.get("orderId").asText() +
                    " prepared and ready for shipping");
            try {
                resolveCb(node.get("cb").asText(), "{}");
            } catch (InterruptedException e) {
                throw new RuntimeException(e);
            }
            String response = "This is the response";
            t.sendResponseHeaders(200, response.length());
            OutputStream os = t.getResponseBody();
            os.write(response.getBytes());
            os.close();
        }
    }

    static class CancelHandler implements HttpHandler {
        @Override
        public void handle(HttpExchange t) throws IOException {
            var deserializer = JacksonSerdes.of(RestaurantRequest.class);
            var restaurantRequest = deserializer.deserialize(t.getRequestBody().readAllBytes());

            logger.info("Cancelling order " + restaurantRequest.orderId);
            logger.info("Order " + restaurantRequest.orderId + " cancelled");
            // Resolve callback
            try {
                resolveCb(restaurantRequest.callbackId, "{}");
                t.sendResponseHeaders(200, -1);
            } catch (InterruptedException e) {
                t.sendResponseHeaders(400, -1);
            }
//            t.getResponseBody().close();
            t.close();
        }
    }

    private static void resolveCb(String callbackId, String payload) throws IOException, InterruptedException {
        HttpClient httpClient = HttpClient.newHttpClient();
        URI uri = URI.create(RESTATE_RUNTIME_ENDPOINT + "/dev.restate.Awakeables/Resolve");
        String requestBody = String.format("{\"id\":\"%s\", \"json_result\":\"%s\"}", callbackId, payload);
        HttpRequest request = HttpRequest.newBuilder()
                .uri(uri)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody, StandardCharsets.UTF_8))
                .build();
        httpClient.send(request, HttpResponse.BodyHandlers.ofString());
    }

}
