import * as uWS from "uWebSockets.js";
import * as clients from "@restatedev/restate-sdk-clients";
import { v4 as uuidv4 } from "uuid";
import type { SendMessage, Socket } from "./socket";

const rs = clients.connect({ url: "http://localhost:8080" });
const Socket: Socket = { name: "socket" };

const sockets = new Map<string, uWS.WebSocket<UserData>>();

interface UserData {
  uuid?: string;
}

const PORT = process.env.PORT ?? "9081";
const SERVER_ADDRESS = process.env.SERVER_ADDRESS ?? `http://localhost:${PORT}`;

const app = uWS
  .App({})
  .ws<UserData>("/*", {
    open: (ws) => {
      const userData = ws.getUserData();

      if (!userData.uuid) {
        userData.uuid = uuidv4();
        sockets.set(userData.uuid, ws);
        console.log(`Stored new websocket against id ${userData.uuid}`);
      }
    },
    message: async (ws, message, isBinary) => {
      const userData = ws.getUserData();

      if (!userData.uuid)
        throw new Error("Found websocket without a uuid set in userData");

      const data = Buffer.from(message).toString(isBinary ? "base64" : "utf8");

      const objectKey = `${SERVER_ADDRESS}/${userData.uuid}`;
      await rs.objectSendClient(Socket, objectKey).receive({
        data,
        base64Encoded: isBinary,
      });
    },
    drain: (ws) => {
      console.log("WebSocket backpressure: " + ws.getBufferedAmount());
    },
    close: (ws, code, message) => {
      const userData = ws.getUserData();

      if (!userData.uuid) return;

      sockets.delete(userData.uuid);
    },
  })
  .post("/:uuid/messages", async (res, req) => {
    const uuid = req.getParameter("uuid");
    if (!uuid) {
      res.writeStatus("500 Bad Request").endWithoutBody();
      return;
    }

    const socket = sockets.get(uuid);
    if (!socket) {
      res.writeStatus("404 Not Found").endWithoutBody();
      return;
    }

    res.onAborted(() => {
      res.aborted = true;
    });

    const body = await parseBody(res);

    if (res.aborted) {
      return;
    }

    const message: SendMessage = JSON.parse(body);

    let result: number;
    if (message.base64Encoded) {
      result = socket.send(
        Buffer.from(message.data, "base64"),
        true,
        message.compress,
      );
    } else {
      result = socket.send(message.data, true, message.compress);
    }

    res.cork(() => {
      res
        .writeStatus("200 OK")
        .writeHeader("content-type", "application/json")
        .end(JSON.stringify(result));
    });
  })
  .listen(Number(PORT), (token) => {
    if (token) {
      console.log("Listening on port", PORT);
    } else {
      console.log("Failed to listen on port", PORT);
    }
  });

const parseBody = (res: uWS.HttpResponse) => {
  return new Promise<string>((resolve) => {
    let buffer: Buffer;
    res.onData((chunk, isLast) => {
      const curBuf = Buffer.from(chunk);
      buffer = buffer
        ? Buffer.concat([buffer, curBuf])
        : isLast
          ? curBuf
          : Buffer.concat([curBuf]);
      if (isLast) {
        resolve(buffer.toString());
      }
    });
  });
};
