package my.example.durablerpc;

import dev.restate.sdk.client.CallRequestOptions;
import dev.restate.sdk.client.Client;

public class MyClient {

    public static String RESTATE_URL = "http://localhost:8080";

    public boolean reserveProduct(String productId, String reservationId) {
        Client restateClient = Client.connect(RESTATE_URL);

        // Durable RPC call to the product service
        // Restate registers the request and makes sure runs to completion exactly once
        boolean reserved = ProductServiceClient.fromClient(restateClient, productId)
                // Restate deduplicates requests with the same idempotency key
                .reserve(CallRequestOptions.DEFAULT.withIdempotency(reservationId));

        return reserved;
    }

    public static void main(String[] args) {
        if (args.length < 2) {
            System.err.println("Specify the productId and reservationId as the arguments: " +
                    "./gradlew run -PmainClass=my.example.durablerpc.MyClient --args=\"productId123 reservationId123\"");
            System.exit(1);
        }
        boolean reserved = new MyClient().reserveProduct(args[0], args[1]);
        System.out.println("Product reserved: " + reserved);
    }
}
