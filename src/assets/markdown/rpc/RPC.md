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

Actually, I won't be using Javascript directly. Instead I will be using **[Typescript](typescriptlang.org "Typescript")**. Typescript is an object oriented language that compiles to Javascript. Typescript is great because it gives us the nice and interesting features of Javascript, while hiding many of its quirks.

### Step 0.2 - Environment Setup
I may come back to this, but I am not going to go into too much detail on the environment setup. I will be using the following: jspm, expressjs, systemjs, typescript, and socket.io which can all be installed using npm.

You can see the final product **[here](https://github.com/JohnEspenhahn/Typescript-RPC)**.

### Step 0.3 - Communicating Client / Server
First we need a client that can communicate with a server. 

If you know anything about Javascript, your first instinct is probably to have an HTML endpoint on the server, and to make XMLHttpRequest calls from the client. Unfortunately this would make it near impossible for our server to initiate remote calls. Instead we will use bi-directionally WebSockets (under the assumption we are using a modern browser that supports WebSockets).

WebSockets provide a socket implementation that at it's core sends byte blobs. This is the base layer of our network communication. On top of WebSockets we will use Socket.IO, which provides an object stream interface. This abstraction above a simple byte-based socket will make implementing RPC simpler.
|     Communication Stack    |
|----------------------------|
|RMI (remote procedure calls)|
|  Socket.IO (object stream) |
|     WebSocket (socket)     |

##### **tldr;** We will use socket.io to communicate between client and server because of its bidirectional nature and its object stream interface

### Problem 1.1 - Specify a Remote Object
In this design, we will have an "eternal" server with arbitrary clients that always start by connecting to this server. 

Our RPC will be designed to be similar to *Java's RMI*. In RMI there are three basic ways to get a remote object: looking it up (by name) in a registry, passing an object to a remote procedure, or returning an object from remote procedure.

We will start with only supporting looking up in a registry. The other two will be easier once we finish the first.

#### The Server's Registry

First we need a way to add objects by name to a registry, so that they can be looked up later. This is simply done with a map. Then we need to be able to accept messages from the network requesting a lookup in this map. This is simple to do with socket.io, as shown below. One thing we do need to add is a way to specify which call we are responding to when we emit a response. This will be done by the call id.

###### Note: socket.io does support a callback feature for emits, but we will be using call ids to more clearly demonstrate some decisions in RPC design

For now assume *Marshaller.marshall()* and *Marshaller.demarshall()* do nothing but return their parameter. The purpose of the marshaller will be clear in a minute.

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

The client will then need a way to make the lookup call and setup a callback to be invoked when the (asynchronous) response comes back.

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
      this.responseCache[req.call_uuid] = (res: any) => {
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
	bar: 1001,
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
	// Will print { bar: 1001 }
});
```
Notice that in the example above, the procedure did not get sent. We need to extend our serialization functionality to allow procedures to somehow be sent.

### Problem 1.2 - Invoke Procedure in Remote Object

The main goal of RPC is to make remote calls look local. This means we don't want the user of our library to have to do any networking. Instead when the user looks up an object, they should get a special object back that does all of the network calls for them behind the scenes. We will call this a *Proxy* object.

We also don't want to make the user create the proxy themselves. Instead we will add a simple marker at the class level to let the library know if a proxy needs to be generated for an instance of a given class. This marker will will be a base class, *Remote*. (Unfortunately this must be a class, and not an interface, or it won't be preserved when compiled to Javascript)

So we have a marker, but how do we generate the proxy? Well, we don't need a proxy until we try to send the local object across the network. So we can be "lazy" about our generation of the proxy and only create it when we try to send an object that extends Remote across the network. So lets create an intermediate layer to do some processing before and after an object is sent to socket.io. Oh how convenient, we have this nice *Marshaller* object. It gets called to before sending the looked up object via socket.io on the server, and after receiving it on the client.

So when we *marshal* an object that extends Remote, we will instead generate a list of method names of methods that can be called remotely. We then send this list of strings across then network. Then the *demarshaller* takes this list of strings and creates a proxy object for us.

```
// Helper interface, need kind to tell if what we're getting is a 
// normal array or a proxy definition
	interface RMIObject {
	kind: string;
	content: any;
}

class Marshaller {
	public static marshal(res: any): RMIObject {
		if (res instanceof Remote) {
			⧸⧸// This can be made more sophisticated to limit
			// which functions get sent. Won't worry about that here
			// See the final result for how to do that
			var⧸⧸var⧸⧸ methods: string[] = [];
		    for (let key of Object.getOwnPropertyNames(res)) {
		      if (key === "constructor") 
			      continue;
		      else if (typeof res[key] === "function")
		        methods.push(key);
		    }
		    return { kind: "proxy", content: methods };
		} else {
			return { kind: "serializable", content: res };
		}
	}

	public static demarshall(res: RMIObject): any {
		if (res.kind === "proxy")
			return ProxyGenerator.load(res.content);
		else
			return res.content;
	}
}
```

You'll notice I haven't given an implementation of ProxyGenerator yet. We need to think carefully about how we generate the proxy. One thing that could happen later is we lookup a remote object and generate a proxy on the client side. Then we want to pass this object to a remote method. So we need to marshal the proxy. Well we don't want to create a proxy for a proxy, so we'll have a dictionary of proxy definitions. Then when demarshalling the original remote object, or a proxy for the object, we can lookup a preexisting proxy and send 

#### This will be coming soon! If you want to try and figure it out yourself feel free to look at the [final product on Github](https://github.com/JohnEspenhahn/Typescript-RPC)!<!--se_discussion_list:{"GQeiCaJBRVlFJsfrInwtHb6h":{"selectionStart":9783,"type":"conflict","selectionEnd":9952,"discussionIndex":"GQeiCaJBRVlFJsfrInwtHb6h"}}-->