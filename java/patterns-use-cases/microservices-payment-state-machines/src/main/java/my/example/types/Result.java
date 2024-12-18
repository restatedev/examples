/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate examples,
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/
 */
package my.example.types;

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
