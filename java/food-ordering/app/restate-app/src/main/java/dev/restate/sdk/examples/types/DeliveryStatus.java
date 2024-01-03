package dev.restate.sdk.examples.types;

public class DeliveryStatus {
  public AssignedDelivery delivery;
  public boolean pickedUp;

  public DeliveryStatus(AssignedDelivery delivery, boolean pickedUp) {
    this.delivery = delivery;
    this.pickedUp = pickedUp;
  }

  public DeliveryStatus() {}
}
