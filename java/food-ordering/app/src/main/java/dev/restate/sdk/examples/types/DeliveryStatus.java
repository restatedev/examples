package dev.restate.sdk.examples.types;

import dev.restate.sdk.examples.generated.OrderProto;

public class DeliveryStatus {
    public OrderProto.AssignDeliveryRequest delivery;
    public boolean pickedUp;

    public DeliveryStatus(OrderProto.AssignDeliveryRequest delivery, boolean pickedUp) {
        this.delivery = delivery;
        this.pickedUp = pickedUp;
    }
}