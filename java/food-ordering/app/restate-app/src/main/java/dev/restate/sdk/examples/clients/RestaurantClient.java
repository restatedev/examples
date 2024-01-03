package dev.restate.sdk.examples.clients;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class RestaurantClient {
    private final HttpClient httpClient = HttpClient.newBuilder().build();

    public static final String RESTAURANT_ENDPOINT =
            System.getenv("RESTAURANT_ENDPOINT") != null ? System.getenv("RESTAURANT_ENDPOINT") : "http://localhost:5050";


    private RestaurantClient() {}

    public static RestaurantClient get(){
        return new RestaurantClient();
    }

    public void prepare(String orderId, String callbackId) throws IOException, InterruptedException {
        this.call(orderId, callbackId, "/prepare");
    }

    private void call(String orderId, String callbackId, String method) throws IOException, InterruptedException {
        URI uri = URI.create(RESTAURANT_ENDPOINT + method);
        String requestBody = "{\"cb\":\"" + callbackId + "\",\"orderId\":\"" + orderId + "\"}";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(uri)
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(requestBody))
                .build();
        HttpResponse<?> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
        if (response.statusCode() == 200) {
            System.out.println("Request was successful");
        } else {
            System.out.println("Request failed with status code: " + response.statusCode());
        }
    }
}
