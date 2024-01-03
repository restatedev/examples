package dev.restate.sdk.examples;

import com.fasterxml.jackson.core.type.TypeReference;
import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.examples.generated.DriverPoolServiceRestate;
import dev.restate.sdk.examples.generated.OrderProto;
import dev.restate.sdk.serde.jackson.JacksonSerdes;

import java.util.LinkedList;
import java.util.Queue;

/**
 * Links available drivers to delivery requests
 */
public class DriverPoolService extends DriverPoolServiceRestate.DriverPoolServiceRestateImplBase {

    // Deliveries that are waiting for a driver to become available
    private final StateKey<Queue<String>> PENDING_DELIVERIES = StateKey.of("pending-deliveries", JacksonSerdes.of(new TypeReference<Queue<String>>() {}));

    // Drivers that are waiting for new delivery requests
    private final StateKey<Queue<String>> AVAILABLE_DRIVERS = StateKey.of("available-drivers", JacksonSerdes.of(new TypeReference<Queue<String>>() {}));

    /**
     * Gets called when a new driver becomes available.
     * Links the driver to the next delivery waiting in line.
     * If no pending deliveries, driver is added to the available driver pool
     */
    @Override
    public void setDriverAvailable(RestateContext ctx, OrderProto.DriverPoolAvailableNotification request) throws TerminalException {
        var pendingDeliveries = ctx.get(PENDING_DELIVERIES).orElse(new LinkedList<>());

        // If there is a pending delivery, assign it to the driver
        var nextDelivery = pendingDeliveries.poll();
        if(nextDelivery != null){
            // Update the queue in state. Delivery was removed.
            ctx.set(PENDING_DELIVERIES, pendingDeliveries);
            // Notify that delivery is ongoing
            ctx.awakeableHandle(nextDelivery).resolve(CoreSerdes.STRING_UTF8, request.getDriverId());
            return;
        }

        // Otherwise remember driver as available
        var availableDrivers = ctx.get(AVAILABLE_DRIVERS).orElse(new LinkedList<>());
        availableDrivers.offer(request.getDriverId());
        ctx.set(AVAILABLE_DRIVERS, availableDrivers);
    }

    /**
     * Gets called when a new delivery gets scheduled.
     * Links the delivery to the next driver available.
     * If no available drivers, the delivery is added to the pending deliveries queue
     */
    @Override
    public void requestDriverForDelivery(RestateContext ctx, OrderProto.DeliveryCallback request) throws TerminalException {
        var availableDrivers = ctx.get(AVAILABLE_DRIVERS).orElse(new LinkedList<>());

        // If a driver is available, assign the delivery right away
        var nextAvailableDriver = availableDrivers.poll();
        if(nextAvailableDriver != null) {
            // Remove driver from the pool
            ctx.set(AVAILABLE_DRIVERS, availableDrivers);
            // Notify that delivery is ongoing
            ctx.awakeableHandle(request.getDeliveryCallbackId()).resolve(CoreSerdes.STRING_UTF8, nextAvailableDriver);
            return;
        }

        // otherwise store the delivery request until a new driver becomes available
        var pendingDeliveries = ctx.get(PENDING_DELIVERIES).orElse(new LinkedList<>());
        pendingDeliveries.offer(request.getDeliveryCallbackId());
        ctx.set(PENDING_DELIVERIES, pendingDeliveries);
    }
}
