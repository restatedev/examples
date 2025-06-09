package my.example.statefulactors;

import static my.example.statefulactors.utils.MachineOperations.bringUpMachine;
import static my.example.statefulactors.utils.MachineOperations.tearDownMachine;

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.endpoint.Endpoint;
import dev.restate.sdk.http.vertx.RestateHttpServer;

// This is a State Machine implemented with a Virtual Object
//
// - The object holds the state of the state machine and defines the methods
//   to transition between the states.
// - The object's unique id identifies the state machine. Many parallel state
//   machines exist, but only state machine (object) exists per id.
// - The "single-writer-per-key" characteristic of virtual objects ensures
//   that one state transition per state machine is in progress at a time.
//   Additional transitions are enqueued for that object, while a transition
//   for a machine is still in progress.
@VirtualObject
public class MachineOperator {

  enum Status {
    UP,
    DOWN
  }

  private static final StateKey<Status> STATUS = StateKey.of("state", Status.class);

  @Handler
  public String setUp(ObjectContext ctx) {
    String machineId = ctx.key();

    // Ignore duplicate calls to start
    var status = ctx.get(STATUS).orElse(Status.DOWN);
    if (status.equals(Status.UP)) {
      return machineId + " is already running";
    }

    // Bringing up a machine is a slow process that frequently crashes
    bringUpMachine(ctx, machineId);
    ctx.set(STATUS, Status.UP);

    return machineId + " is now running";
  }

  @Handler
  public String tearDown(ObjectContext ctx) {
    String machineId = ctx.key();

    var status = ctx.get(STATUS).orElse(Status.DOWN);
    if (!status.equals(Status.UP)) {
      return machineId + " is not up, cannot tear down";
    }

    // Tearing down a machine is a slow process that frequently crashes
    tearDownMachine(ctx, machineId);
    ctx.set(STATUS, Status.DOWN);

    return machineId + " is now down";
  }

  public static void main(String[] args) {
    RestateHttpServer.listen(Endpoint.bind(new MachineOperator()));
  }
}
