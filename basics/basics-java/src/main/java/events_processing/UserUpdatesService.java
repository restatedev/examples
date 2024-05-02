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

package events_processing;

//
// Processing events (from Kafka) to update various downstream systems.
//  - Journaling actions in Restate and driving retries from Restate, recovering
//    partial progress
//  - Preserving the order-per-key, but otherwise allowing high-fanout, because
//    processing of events does not block other events.
//  - Ability to delay events when the downstream systems are busy, without blocking
//    entire partitions.
//

import dev.restate.sdk.ObjectContext;
import dev.restate.sdk.annotation.Handler;
import dev.restate.sdk.annotation.VirtualObject;
import dev.restate.sdk.common.CoreSerdes;
import dev.restate.sdk.http.vertx.RestateHttpEndpointBuilder;
import events_state.ProfileService;
import utils.UserUpdate;

import java.time.Duration;

import static utils.ExampleStubs.*;

//
// Processing events (from Kafka) to update various downstream systems.
//  - Journaling actions in Restate and driving retries from Restate, recovering
//    partial progress
//  - Preserving the order-per-key, but otherwise allowing high-fanout, because
//    processing of events does not block other events.
//  - Ability to delay events when the downstream systems are busy, without blocking
//    entire partitions.
//

@VirtualObject
public class UserUpdatesService {

    /*
     * uses the Event's key (populated for example from Kafka's key) to route the events to the correct Virtual Object.
     * And ensures that events with the same key are processed one after the other.
     */
    @Handler
    public void updateUserEvent(ObjectContext ctx, UserUpdate update) {

        // event handler is a durably executed function that can use all the features of Restate
        String userId = ctx.run(CoreSerdes.JSON_STRING, () -> updateUserProfile(update.getProfile()));
        while(userId.equals("NOT_READY")) {
            // Delay the processing of the event by sleeping.
            // The other events for this Virtual Object / key are queued.
            // Events for other keys are processed concurrently.
            // The sleep suspends the function (e.g., when running on FaaS).
            ctx.sleep(Duration.ofMillis(5000));
            userId = ctx.run(CoreSerdes.JSON_STRING, () -> updateUserProfile(update.getProfile()));
        }


        String finalUserId = userId;
        String roleId = ctx.run(CoreSerdes.JSON_STRING,
                () -> setUserPermissions(finalUserId, update.getPermissions()));
        ctx.run(() -> provisionResources(finalUserId, roleId, update.getResources()));
    }

    public static void main(String[] args) {
        RestateHttpEndpointBuilder.builder()
                .bind(new UserUpdatesService())
                .buildAndListen();
    }

}
