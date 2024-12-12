/*
 * Copyright (c) 2024 - Restate Software, Inc., Restate GmbH
 *
 * This file is part of the Restate Examples
 * which is released under the MIT license.
 *
 * You can find a copy of the license in the file LICENSE
 * in the root directory of this repository or package or at
 * https://github.com/restatedev/examples/blob/main/LICENSE
 */

package events_state;

import dev.restate.sdk.JsonSerdes;
import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.StateKey;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import utils.UserProfile;

//
// Populate state from events (from Kafka).
// Query the state via simple RPC/HTTP calls.
//
@VirtualObject
public class ProfileService {

    private static final StateKey<String> NAME =
            StateKey.of("name", JsonSerdes.STRING);

    private static final StateKey<String> EMAIL =
            StateKey.of("email", JsonSerdes.STRING);

    @Handler
    public void registration(ObjectContext ctx, String name){
        // store in state the user's information as coming from the registration event
        ctx.set(NAME, name);
    }

    @Handler
    public void email(ObjectContext ctx, String email){
        // store in state the user's information as coming from the email event
        ctx.set(EMAIL, email);
    }

    @Handler
    public UserProfile get(ObjectContext ctx){
        var name = ctx.get(NAME).orElse("");
        var email = ctx.get(EMAIL).orElse("");
        return new UserProfile(ctx.key(), name, email);
    }

    public static void main(String[] args) {
        RestateHttpEndpointBuilder.builder()
                .bind(new ProfileService())
                .buildAndListen();
    }
}
