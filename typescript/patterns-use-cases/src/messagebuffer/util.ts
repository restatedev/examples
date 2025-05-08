import * as restate from "@restatedev/restate-sdk";
import { Context, ObjectContext } from "@restatedev/restate-sdk";
import type { Buffer, Notification } from "./buffer";

type NotificationFrom<D> =
  D extends restate.VirtualObjectDefinition<string, infer M>
    ? M extends {
        bufferNotify: (ctx: ObjectContext, req: Notification) => void;
      }
      ? D
      : {
          name: "notification destination must contain a method 'bufferNotify'";
        }
    : { name: "notification destination must be a virtual object" };

const Buffer: Buffer = { name: "buffer" };

export function bufferMessage<D>(
  ctx: Context,
  obj: NotificationFrom<D>,
  key: string,
  message: unknown,
) {
  ctx.objectSendClient(Buffer, key).add({
    message,
    notify: {
      service: obj.name,
      method: "bufferNotify",
      key,
    },
  });
}
