import jsonrpc from "jsonrpc-lite";

type RPCResult = {
  id: string;
  error: string | null;
  result: any;
};

class RPCClient {
  // connection to json-rpc server
  conn: WebSocket;

  // a mapping of request id to resolve/reject callbacks of the promise returned by call(/* */)
  inFlight: Map<number, { resolve: (RPCResult) => any; reject: (any) => any }>;

  // incrementing request ID
  currId: number;

  constructor(conn: WebSocket) {
    this.conn = conn;
    this.inFlight = new Map();
    this.currId = 1;

    // called when message is recieved from websocket connection
    //   1) check if it's in the inFlight map
    //   2) if it is, but there's an error, call the reject callback with the error
    //   3) otherwise, call the resolve callback with the result
    const fulfilCall = data => {
      const req = this.inFlight.get(data.id);

      if (!req) {
        // TODO: Handle request not found case
        // Throw error?
        return;
      }

      if (data.error !== null) {
        return req.reject(data.error);
      }

      req.resolve(data.result);
    };

    conn.onmessage = e => {
      const data = JSON.parse(e.data);

      if (Array.isArray(data)) {
        data.map(fulfilCall);
      } else {
        fulfilCall(data);
      }
    };
  }

  call(name: string, argument: any): Promise<RPCResult> {
    // implement batching?
    //  1) set timeout when call is made
    //  2) reset if new call is made before time is up
    //  3) send when timer runs out

    // get a properly formatted json-rpc call object
    // wrap argument in array since go json-rpc expects an array of 1 argument
    const req = jsonrpc.request(this.currId, name, [argument]);

    this.conn.send(req);

    // create a promise and put the reject and resolve callbacks
    //   into the inflight map with the id of the request
    const resolveCall = (resolve: (RPCResult) => any, reject) => {
      this.inFlight.set(this.currId, { resolve, reject });
    };

    const futureResponse = new Promise(resolveCall);

    this.currId += 1;

    return futureResponse;
  }
}

const connect = (wsAddress: string): Promise<RPCClient> => {
  // connect to the websocket address
  // if there are no errors return the RPCClient object
  const conn = new WebSocket(wsAddress);

  const createRPC = (resolve, reject) => {
    conn.onopen = () => {
      resolve(new RPCClient(conn));
    };

    conn.onerror = e => {
      reject(e);
    };
  };

  return new Promise(createRPC);
};

export default { connect };
