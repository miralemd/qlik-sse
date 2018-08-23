# qlik-sse

`qlik-sse` is an npm package that simplifies the creation of Qlik Server Side Extensions in nodejs.

Check out [Server Side Extension](https://github.com/qlik-oss/server-side-extension) for more info and how to get started from the Qlik side.

## Usage

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

// start the server
s.start({
  port: 50051
});
```

and then run it:

```sh
node foo.js
```

You have now successfully created a Server Side Extension that can be used from within Qlik Sense or QlikView.

Take a look at some of the [examples](./examples) on how to add functionality to the SSE.

## TODO

- Documentation
  - API
  - Explain function types `SCALAR`, `AGGREGATION` and `TENSOR`
- Examples
  - How to use tensorflow with qix data
  - Real use cases
    - linear regression
    - k-means
    - ...
  - Full Qlik example
    - configuring Qlik Engine to use SSEPlugin
    - dockerized environment
    - loading data
    - expression calls
- Features
  - Script evaluation
  - Error handling
