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

 package my.example;

 import dev.restate.sdk.lambda.BaseRestateLambdaHandler;
 import dev.restate.sdk.lambda.RestateLambdaEndpointBuilder;

 import my.example.Greeter;

 public class LambdaHandler extends BaseRestateLambdaHandler {
     @Override
     public void register(RestateLambdaEndpointBuilder builder) {
         builder.bind(new Greeter());
     }
 }
