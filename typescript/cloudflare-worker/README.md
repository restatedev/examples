# Cloudflare worker example

This example uses the experimental Cloudflare worker support in the typescript SDK.

To deploy and test the example:

```bash
$ npm run deploy
> cloudflare-worker@0.0.0 deploy
> wrangler deploy

 ⛅️ wrangler 3.29.0
-------------------
Total Upload: 898.22 KiB / gzip: 123.71 KiB
Uploaded cloudflare-worker (3.69 sec)
Published cloudflare-worker (1.32 sec)
  https://cloudflare-worker.<yourdomain>.workers.dev
Current Deployment ID: bcd703b7-9619-498a-b7d3-c33575c042ef

$ restate deployments register https://cloudflare-worker.<yourdomain>.workers.dev
Deployment ID:  dp_146gfndB2zqJYoGW2d6q91L

❯ SERVICES THAT WILL BE ADDED:
  - Greeter
    Type: Keyed ⬅️ 🚶🚶🚶
     METHOD            INPUT TYPE  OUTPUT TYPE
     greet             RpcRequest  RpcResponse
     greetAndRemember  RpcRequest  RpcResponse


✔ Are you sure you want to apply those changes? · yes
✅ DEPLOYMENT:
 SERVICE  REV
 Greeter  1

$ curl <restate-instance>:8080/Greeter/greet -H "Content-Type: application/json" -d '{"key": "from Cloudflare"}'
{"response":"Hello from Cloudflare :-)"}
```

For live development, there is a modified `npm run dev` command that serves the development server over http2 on :8787
while `wrangler` serves http1 on :8786. This command requires the utility `nghttpx` which is part of
the `nghttp2` package.

Usage:

```bash
$ npm run dev
$ restate deployments register http://127.0.0.1:8787
Deployment ID:  dp_11cNUTKZ0LitOYN063jXZHH

❯ SERVICES THAT WILL BE ADDED:
  - Greeter
    Type: Keyed ⬅️ 🚶🚶🚶
     METHOD            INPUT TYPE  OUTPUT TYPE
     greet             RpcRequest  RpcResponse
     greetAndRemember  RpcRequest  RpcResponse


✔ Are you sure you want to apply those changes? · yes
✅ DEPLOYMENT:
 SERVICE  REV
 Greeter  1
```

