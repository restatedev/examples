package my.example.durablerpc;

import dev.restate.client.Client;
import java.util.Optional;

public class MyClient {

  public static String RESTATE_URL = "http://localhost:8080";

  public boolean reserveProduct(String productId, String reservationId) {
    Client restateClient = Client.connect(RESTATE_URL);

    // Durable RPC call to the product service
    // Restate registers the request and makes sure runs to completion exactly once
    boolean reserved =
        ProductServiceClient.fromClient(restateClient, productId)
            // Restate deduplicates requests with the same idempotency key
            .reserve(opts -> opts.idempotencyKey(reservationId));

    return reserved;
  }

  // To run from CLI
  // ./gradlew run -PmainClass=my.example.durablerpc.MyClient --args="productId123 reservationId123"
  public static void main(String[] args) {
    String productId = Optional.ofNullable(args[0]).orElse("productId123");
    String reservationId = Optional.ofNullable(args[1]).orElse("reservationId123");
    boolean reserved = new MyClient().reserveProduct(productId, reservationId);
    System.out.println("Product reserved: " + reserved);
  }
}
