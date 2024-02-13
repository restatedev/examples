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

package examples.order.types;

public enum StatusEnum {
  NEW(0),
  CREATED(1),
  SCHEDULED(2),
  IN_PREPARATION(3),
  SCHEDULING_DELIVERY(4),
  WAITING_FOR_DRIVER(5),
  IN_DELIVERY(6),
  DELIVERED(7),
  REJECTED(8),
  CANCELLED(9);

  private final int value;

  StatusEnum(int value) {
    this.value = value;
  }

  public int getValue() {
    return value;
  }
}
