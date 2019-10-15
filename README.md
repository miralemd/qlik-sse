# qlik-sse

`qlik-sse` is an npm package that simplifies the creation of Qlik Server Side Extensions in nodejs.

Check out [Server Side Extension](https://github.com/qlik-oss/server-side-extension) for more info and how to get started from the Qlik side.

---

- [Getting started](#getting-started)
- [Concepts](./docs/concepts.md)
- [API documentation](./docs/api.md)

---

## Getting started

### Prerequisites

Before continuing, make sure you:

- have Node.js >= v8.0.0 installed
- can configure your Qlik installation (or dockerized Qlik Engine)

### Usage

Start by installing `qlik-sse`:

```sh
npm install qlik-sse
```

Next, create a file `foo.js`: 
```js
const q = require('qlik-sse');

// create an instance of the server
const s = q.server({
  identifier: 'xxx',
  version: '0.1.0',
});

// register functions
s.addFunction(/* */);

// start the server
s.start({
  port: 50051,
  allowScript: true
});
```

and then run it to start the SSE plugin server:

```sh
node foo.js
```

Configure the SSE in your Qlik installation by following [these instructions](https://github.com/qlik-oss/server-side-extension/blob/master/docs/configuration.md)

If you're running Qlik Sense Desktop (or Qlik Engine) locally, restart it after starting the SSE server to allow Qlik Engine to get the SSE plugin's capabilities.

Assuming you have named the plugin `sse`, you should now be able to use it's script functions in expressions:

```basic
sse.ScriptEval('return Math.random()*args[0]', sum(Sales));
```

You have now successfully created a Server Side Extension that can be used from within Qlik Sense or Qlik Core.

Take a look at some of the [examples](./examples) on how to add functionality to the SSE.

## TODO

- Documentation
  - [x] API
  - [x] Explain function types `SCALAR`, `AGGREGATION` and `TENSOR`
  - [x] Table load
- Examples
  - [ ] How to use tensorflow with qix data
  - Real use cases
    - [ ] linear regression
    - [x] k-means
    - ...
  - Full Qlik example
    - [x] configuring Qlik Engine to use SSEPlugin
    - [x] dockerized environment
    - [ ] loading data
    - [ ] expression calls
- Features
  - [x] Script evaluation
  - Error handling
