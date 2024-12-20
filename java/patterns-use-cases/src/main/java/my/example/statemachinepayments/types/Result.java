package my.example.statemachinepayments.types;

public class Result {
  private final boolean success;
  private final String reason;

  public Result(boolean success, String reason) {
    this.success = success;
    this.reason = reason;
  }

  public boolean isSuccess() {
    return success;
  }

  public String getReason() {
    return reason;
  }

  @Override
  public String toString() {
    return "Result{" + "success=" + success + ", reason='" + reason + '\'' + '}';
  }
}
