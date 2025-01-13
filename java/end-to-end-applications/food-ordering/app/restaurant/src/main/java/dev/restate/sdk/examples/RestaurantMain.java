package dev.restate.sdk.examples;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.net.InetSocketAddress;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;

import dev.restate.sdk.client.Client;
import dev.restate.sdk.common.Serde;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

/**
 * Restaurant POS system (HTTP server) that receives preparation requests for orders from the
 * OrderService. Once a preparation has been completed, it notifies the OrderService via the
 * callback.
 */
public class RestaurantMain {
  private static final Logger logger = LogManager.getLogger(RestaurantMain.class);
  public static final String RESTATE_RUNTIME_ENDPOINT =
      System.getenv("RESTATE_RUNTIME_ENDPOINT") != null
          ? System.getenv("RESTATE_RUNTIME_ENDPOINT")
          : "http://localhost:8080";

  public static void main(String[] args) throws IOException {
    HttpServer server = HttpServer.create(new InetSocketAddress(5050), 0);
    server.createContext("/prepare", new PrepareHandler());
    server.setExecutor(null);
    server.start();
    logger.info("Restaurant POS server is listening on port 5050...");
  }

  /** Preparation request handler. */
  static class PrepareHandler implements HttpHandler {

    private static final ScheduledExecutorService DELAY_EXECUTOR =
        Executors.newSingleThreadScheduledExecutor();

    private final Client ingressClient = Client.connect(RESTATE_RUNTIME_ENDPOINT);

    @Override
    public void handle(HttpExchange t) throws IOException {
      ObjectMapper mapper = new ObjectMapper();
      JsonNode node = mapper.readTree(t.getRequestBody());
      String orderId = node.get("orderId").asText();
      String callbackId = node.get("cb").asText();

      logger.info("Order {} received", orderId);

      Runnable orderReadyNotification = () -> {
        logger.info("Order {} prepared and ready for shipping", orderId);
        ingressClient.awakeableHandle(callbackId).resolve(Serde.VOID, null);
      };
      DELAY_EXECUTOR.schedule(orderReadyNotification, 3, TimeUnit.SECONDS);

      t.sendResponseHeaders(200, -1);
    }
  }
}
