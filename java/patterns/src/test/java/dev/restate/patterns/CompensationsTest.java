package dev.restate.patterns;

import static org.junit.jupiter.api.Assertions.assertThrows;

import dev.restate.patterns.compensations.generated.CarRentalRestate;
import dev.restate.patterns.compensations.generated.FlightsRestate;
import dev.restate.patterns.compensations.generated.PaymentRestate;
import dev.restate.patterns.compensations.generated.Proto;
import dev.restate.patterns.compensations.generated.Proto.FlightBookingId;
import dev.restate.patterns.compensations.generated.Proto.FlightBookingRequest;
import dev.restate.patterns.compensations.generated.Proto.PaymentId;
import dev.restate.patterns.compensations.generated.Proto.PaymentRequest;
import dev.restate.patterns.compensations.generated.TravelGrpc;
import dev.restate.sdk.RestateContext;
import dev.restate.sdk.common.TerminalException;
import dev.restate.sdk.testing.RestateGrpcChannel;
import dev.restate.sdk.testing.RestateRunner;
import dev.restate.sdk.testing.RestateRunnerBuilder;
import io.grpc.ManagedChannel;
import io.grpc.StatusRuntimeException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;

public class CompensationsTest {
  // Runner runs Restate using testcontainers and registers services
  @RegisterExtension
  private static final RestateRunner restateRunner =
      RestateRunnerBuilder.create()
          // Service to test
          .withService(new Compensations.TravelService())
          // Helper services
          .withService(new MockFlightsService())
          .withService(new MockCarRentalService())
          .withService(new MockPaymentService())
          .buildRunner();

  @Test
  void testGreet(
      // Channel to send requests to Restate services
      @RestateGrpcChannel ManagedChannel channel) {
    TravelGrpc.TravelBlockingStub client = TravelGrpc.newBlockingStub(channel);

    assertThrows(
        StatusRuntimeException.class,
        () -> client.reserve(Proto.TravelBookingRequest.newBuilder().setTripID("myTrip").build()),
        "INTERNAL: Failed to reserve the trip: Failed to reserve car rental. Ran 1 compensations.");
  }

  // --------------------------------------------------------------------------------------
  // Helper services for the test
  // --------------------------------------------------------------------------------------

  private static final class MockFlightsService extends FlightsRestate.FlightsRestateImplBase {
    @Override
    public FlightBookingId reserve(RestateContext context, FlightBookingRequest request)
        throws TerminalException {
      return FlightBookingId.newBuilder().setBookingId(request.getTripId()).build();
    }

    @Override
    public void confirm(RestateContext context, FlightBookingId request) throws TerminalException {}

    @Override
    public void cancel(RestateContext context, FlightBookingId request) throws TerminalException {}
  }

  private static final class MockCarRentalService
      extends CarRentalRestate.CarRentalRestateImplBase {
    @Override
    public Proto.CarRentalId reserve(RestateContext context, Proto.CarRentalRequest request)
        throws TerminalException {
      // let's simulate that the car rental service failed to reserve the car
      throw new TerminalException(TerminalException.Code.INTERNAL, "Failed to reserve car rental");
    }

    @Override
    public void confirm(RestateContext context, Proto.CarRentalId request)
        throws TerminalException {}

    @Override
    public void cancel(RestateContext context, Proto.CarRentalId request)
        throws TerminalException {}
  }

  private static final class MockPaymentService extends PaymentRestate.PaymentRestateImplBase {
    @Override
    public PaymentId process(RestateContext context, PaymentRequest request)
        throws TerminalException {
      return PaymentId.newBuilder().setPaymentId(request.getTripId()).build();
    }

    @Override
    public void refund(RestateContext context, PaymentId request) throws TerminalException {}
  }
}
