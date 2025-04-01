/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate examples,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */

package dev.restate.sdk.examples.clients;

import dev.restate.sdk.types.TerminalException;

import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class RestaurantClient {

  public static final String RESTAURANT_ENDPOINT =
      System.getenv("RESTAURANT_ENDPOINT") != null
          ? System.getenv("RESTAURANT_ENDPOINT")
          : "http://localhost:5050";

  private final HttpClient httpClient;

  private RestaurantClient() {
    httpClient = HttpClient.newBuilder().build();
  }

  public static RestaurantClient get() {
    return new RestaurantClient();
  }

  public void prepare(String orderId, String callbackId) throws IOException, InterruptedException {
    this.call(orderId, callbackId, "/prepare");
  }

  private void call(String orderId, String callbackId, String method)
      throws IOException, InterruptedException {
    URI uri = URI.create(RESTAURANT_ENDPOINT + method);
    String requestBody = String.format("{\"cb\":\"%s\",\"orderId\":\"%s\"}", callbackId, orderId);
    HttpRequest request =
        HttpRequest.newBuilder()
            .uri(uri)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .build();
    HttpResponse<?> response = httpClient.send(request, HttpResponse.BodyHandlers.discarding());
    if (response.statusCode() != 200) {
      throw new TerminalException(
          "Prepare request to restaurant failed with status code: " + response.statusCode());
    }
  }
}
