# Descriptiion

A simple client for JSON-RPC over websockets. Built for use with Golang's JSON-RPC implementation.

Abstracts the JS websocket event API into promises, and handles encoding and decoding JSON-RPC format.

# Usage

```javascript
import rpc from "ws-json-rpc-client";

async function main() {
  const client = await rpc.connect("ws://foo.bar/rpc");
  const result = await client.call("ServerMath.Multiply", { a: 3, b: 5 });
  console.log(result);
}

main(); // 15
```
