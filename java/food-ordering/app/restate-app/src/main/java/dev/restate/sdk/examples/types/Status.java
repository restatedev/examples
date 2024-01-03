package dev.restate.sdk.examples.types;

import java.util.HashMap;
import java.util.Map;

public enum Status {
    NEW(0),
    CREATED(1),
    SCHEDULED(2),
    IN_PREPARATION(3),
    SCHEDULING_DELIVERY(4),
    WAITING_FOR_DRIVER(5),
    IN_DELIVERY(6),
    DELIVERED(7),
    REJECTED(8),
    CANCELLED(9),
    UNKNOWN(10);

    private final int value;
    private static Map<Integer, Status> map = new HashMap<>();

    private Status(int value) {
        this.value = value;
    }

    static {
        for (Status stat : Status.values()) {
            map.put(stat.value, stat);
        }
    }

    public static Status valueOfLabel(int pageType) {
        return map.get(pageType);
    }

    public int getValue() {
        return value;
    }
}