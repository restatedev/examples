package dev.restate.sdk.examples.types;

import dev.restate.sdk.examples.generated.OrderProto;

public class DeliveryStatus {
    public AssignedDelivery delivery;
    public boolean pickedUp;

    public DeliveryStatus(AssignedDelivery delivery, boolean pickedUp) {
        this.delivery = delivery;
        this.pickedUp = pickedUp;
    }

    public DeliveryStatus() {}
}