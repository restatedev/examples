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
package dev.restate.sdk.examples.clients

import dev.restate.sdk.types.TerminalException
import java.net.URI
import java.net.http.HttpClient
import java.net.http.HttpRequest
import java.net.http.HttpResponse

object RestaurantClient {
  private val httpClient: HttpClient = HttpClient.newBuilder().build()
  private val RESTAURANT_ENDPOINT: String =
      System.getenv("RESTAURANT_ENDPOINT") ?: "http://localhost:5050"

  fun prepare(orderId: String, callbackId: String) {
    this.call(orderId, callbackId, "/prepare")
  }

  private fun call(orderId: String, callbackId: String, method: String) {
    val uri = URI.create(RESTAURANT_ENDPOINT + method)
    val requestBody = String.format("{\"cb\":\"%s\",\"orderId\":\"%s\"}", callbackId, orderId)
    val request =
        HttpRequest.newBuilder()
            .uri(uri)
            .header("Content-Type", "application/json")
            .POST(HttpRequest.BodyPublishers.ofString(requestBody))
            .build()
    val response: HttpResponse<*> = httpClient.send(request, HttpResponse.BodyHandlers.discarding())
    if (response.statusCode() != 200) {
      throw TerminalException(
          "Prepare request to restaurant failed with status code: " + response.statusCode())
    }
  }
}
