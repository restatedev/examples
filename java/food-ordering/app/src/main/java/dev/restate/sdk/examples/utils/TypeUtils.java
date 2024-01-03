package dev.restate.sdk.examples.utils;

import dev.restate.sdk.examples.generated.OrderProto.*;
import dev.restate.sdk.examples.types.OrderRequest;


public class TypeUtils {

    public static OrderStatus statusToProto(String id, Status status){
        return OrderStatus.newBuilder().setId(id).setStatus(status).build();
    }


}
