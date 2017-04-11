## Remote Procedure Calls
#### A case study in Javascript
----
###### Note: in this article I will use *procedure* to mean a block of code that *can* accept parameters, executes a block, and *can* return a single value. (i.e. a catch all for procedure/method/function)

The goal for a Remote Procedure Call (RPC) library is to make *remote procedure calls* look like a normal, local procedure call.

To do this we require the ability to 
1. Specify a procedure in a remote object
2. Specify parameters for a remote procedure
3. Get a return value from a remote procedure

### Step 0.1 - Implementation Language
In this case study I will be using Javascript. The reason is twofold: it has a lot of useful "out-of-the-box" features, and it introduces some interesting RPC design problems. (Think about why its single threaded nature could be a problem)

Actually, I won't be using Javascript directly. Instead I will be using **[Typescript](typescriptlang.org "Typescript")**. Typescript is an object oriented "language" that compiles to Javascript. Typescript is great because it gives us the nice and interesting features of Javascript, while hiding many of its quirks.

### Step 0.2 - Environment Setup
I may come back to this, but I am not going to go into too much detail on the environment setup. I will be using the following: jspm, expressjs, systemjs, typescript, and socket.io which can all be installed using npm.

You can see the final product **[here](https://github.com/JohnEspenhahn/Typescript-RPC)**.

### Step 0.3 - Communicating Client / Server
First we need a client that can communicate with a server. 

If you know anything about Javascript, your first instinct is probably to have an HTML endpoint on the server, and to make XMLHttpRequest calls from the client. Unfortunately this would make it near impossible for our server to initiate remote calls. Instead we will use bi-directionally WebSockets (under the assumption we are using a modern browser that supports WebSockets).

WebSockets provide a socket implementation that at it's core sends byte blobs. This is the base layer of our network communication. On top of WebSockets we will use Socket.IO, which provides an object stream interface. This abstraction above a simple byte-based socket will make implementing RPC simpler.

**Communication Stack**<br/>
RMI (remote procedure calls)<br/>
Socket.IO (object communication)<br/>
WebSocket (socket)

##### **tldr;** We will use socket.io to communicate between client and server because of its bidirectional nature and its object stream interface

### Problem 1.1 - Specify a Remote Object
In this design, we will have an "eternal" server with arbitrary clients that always start by connecting to this server. 

Our RPC will be designed to be similar to *Java's RMI*. In RMI there are two basic ways to specify a remote object: by looking it up in a registry, or by providing it as a parameter to another remote procedure.

We will start with only supporting looking up in a registry. 

#### Serialization
First we need a way to send objects over the network. Javascript has JSON.stringify() built in, but it does not support sending functions. Obviously we need to send functions somehow. We will build a custom "Marshaller" object that extends JSON to allow marshalling of procedures across the network. [Here is the simplest version](https://gist.github.com/JohnEspenhahn/347a18d3ab5ec6f1b004ebe374321b6e).

```javascript
export class Marshaller {

  /// Super simple extended javascript serialization
	public static marshall(obj: any): string {
		var res = obj;
		if (typeof obj === "object")
			for (var key in obj) res[key] = "";
		return JSON.stringify(res);
	}

	public static demarshall(res: string): any {
		return JSON.parse(res);
	}

}
```

#### The Server's Registry
###### [Full example with supporting interfaces](https://gist.github.com/JohnEspenhahn/4325e574b2a0b2fc321a4c42dbb5c34e)
```javascript
export class RMIServerRegistry {
  private static registry: RMIServerRegistry;

  // Map of the objects being served
  private serving: { [id: string]: any } = {};

  private constructor(io: SocketIO.Server) {
    io.on("connection", (socket: RMI.Socket) => {

      socket.on('lookup', (data: RMILookupRequest) => {
        this.remote_lookup(data.path, data.call_uuid, socket);
      });

    });
  }

  /// Get the Registry singleton
  public static get(io: SocketIO.Server): RMIServerRegistry {
    if (RMIServerRegistry.registry == null)
      RMIServerRegistry.registry = new RMIServerRegistry(io);

    return RMIServerRegistry.registry;
  }

  /// Add an object to the map
  public serve(path: string, obj: any): boolean {
    if (this.serving[path]) {
      return false;
    } else {
      this.serving[path] = obj;
      return true;
    }
  }

  /// Lookup object in the registry
  ///  will return null if not serving
  private remote_lookup(path: string, call_uuid: string, source: RMI.Socket): any {
    var obj = this.serving[path];
    var res: RMIResponse = { 
        call_uuid: call_uuid, 
        response: Marshaller.marshall(obj)
    };

    source.emit('response', res);
  }

}
```

#### The Client Lookup

###### [Full example with supporting interfaces](https://gist.github.com/JohnEspenhahn/e08a2f92f81005d9ff04d749d0a5d27a)

```javascript
export class RMIClientRegistry {
  private static registry: RMIClientRegistry;
  private static socket: RMI.Socket;

  private responseCache: ResponseCache;

  private constructor(private socket: RMI.Socket) {
    this.responseCache = { };

    socket.on('response', (data: RMIResponse) => {
      var callback = this.responseCache[data.call_uuid];
      if (callback) {
        delete this.responseCache[data.call_uuid];
        callback(data.response);
      }
    });
  }

  /// Get socket.io socket singleton
  public static getIO(): RMI.Socket {
    if (RMIClientRegistry.socket) return RMIClientRegistry.socket;
    else if (!io || typeof io.connect !== "function") throw "Socket.io not imported!";

    var sock = io.connect();
    RMIClientRegistry.socket = sock;
    return sock;
  }

  /// Get the client registry singleton instance
  public static get(socket: RMI.Socket = null): RMIClientRegistry {
    if (RMIClientRegistry.registry == null) {
      if (socket == null) socket = RMIClientRegistry.getIO();
      RMIClientRegistry.registry = new RMIClientRegistry(socket);
    }

    return RMIClientRegistry.registry;
  }

  /// Lookup the Remote served at the given path on the server
  public lookup(path: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      var req: RMILookupRequest = { 
        path: path,
        call_uuid: UUID.generate()
      };

      // Register a callback for this request
      this.responseCache[req.call_uuid] = (res: string) => {
        resolve(Marshaller.demarshall(res));
      });
    
      this.socket.emit('lookup', req);
    });
  }

}
```

#### Sample Usage

##### This is pseudocode, you would need to create an express http server to server the client and the websocket.

Server:
```javascript
// Create socket.io server
var io = require('socket.io')(server);

import { RMIServerRegistry } from "./RMIServerRegistry";
var registry: RMIServerRegistry = RMIServerRegistry.get(io);
registry.serve("server", { 
	foo: function() { 
		console.log("Called foo") 
	} 
});
```

Client:
```javascript
var registry = RMIClientRegistry.get();
registry.lookup("server").then((server: any) => {
	console.log(server);
	// Will print {foo: ""}
	// Notice server.foo() is NOT valid
});
```

### Problem 1.2 - Invoke Procedure in Remote Object

Next we need to extend Marshalling and Demarshalling to allow us to actually invoke procedures in remote objects.

#### This will be coming soon! If you want to try and figure it out yourself feel free to look at the [final product on github](https://github.com/JohnEspenhahn/Typescript-RPC)!