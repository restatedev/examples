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
package my.example.serde;

import com.stripe.model.PaymentIntent;
import com.stripe.net.ApiResource;
import dev.restate.sdk.common.Serde;

public class PaymentIntentSerde implements Serde<PaymentIntent> {
  @Override
  public byte[] serialize(PaymentIntent intent) {
    return intent.toJson().getBytes();
  }

  @Override
  public PaymentIntent deserialize(byte[] bytes) {
    return ApiResource.GSON.fromJson(new String(bytes), PaymentIntent.class);
  }
}
