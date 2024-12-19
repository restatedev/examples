package my.example.durablerpc;

import dev.restate.sdk.JsonSerdes;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

/*
 * Have a look at the ProductServiceClient class to see how to call Restate handlers
 * programmatically from another process.
 */
@VirtualObject
public class ProductService {
    private static final Logger logger = LogManager.getLogger(ProductService.class);

    private static final StateKey<Boolean> RESERVED = StateKey.of("reserved", JsonSerdes.BOOLEAN);


    @Handler
    public boolean reserve(ObjectContext ctx) {
        if (ctx.get(RESERVED).orElse(false)){
            logger.info("Product already reserved");
            return false;
        }
        logger.info("Reserving product");
        ctx.set(RESERVED, true);
        return true;
    }

    public static void main(String[] args) {
        RestateHttpEndpointBuilder.builder()
            .bind(new ProductService())
            .buildAndListen();
    }
}
