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

package examples.order;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import dev.restate.sdk.KeyedContext;
import dev.restate.sdk.common.TerminalException;
import examples.order.generated.OrderProto.KafkaOrderEvent;
import examples.order.generated.OrderWorkflowSubmitterRestate;
import examples.order.types.OrderRequest;

/**
 * This service submits order workflows starting from kafka events
 */
public class OrderWorkflowSubmitter extends OrderWorkflowSubmitterRestate.OrderWorkflowSubmitterRestateImplBase {

  @Override
  public void handleOrderCreationEvent(KeyedContext ctx, KafkaOrderEvent event)
      throws TerminalException {
    ObjectMapper mapper = new ObjectMapper();
    OrderRequest order;
    try {
      order = mapper.readValue(event.getPayload().toStringUtf8(), OrderRequest.class);
    } catch (JsonProcessingException e) {
      throw new TerminalException("Parsing raw JSON order failed: " + e.getMessage());
    }

    var orderWorkflow = new OrderWorkflowRestateClient(ctx, order.getOrderId());
    orderWorkflow.submit(order);
  }
}
