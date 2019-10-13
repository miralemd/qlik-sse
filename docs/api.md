# API

## `q`

The `qlik-sse` module

```js
const q = require('qlik-sse');
```

### `q.sse`

A namespace for easy access to types, all types in [SSE.proto](../assets/SSE.proto) are accessible from this namespace:

```js
console.log(q.sse.FunctionType.AGGREGATION); // 1
```

### `q.server(options)`

- `options` <[Object]>
  - `identifier` <[string]> Identifier for this SSE plugin.
  - `allowScript` <[boolean]> Whether to allow script evaluation. Defaults to `false`.
- returns: <[Server](#server)>

Creates a new [Server](#server) instance.

```js
const q = require('qlik-sse');

const server = q.server({
  identifier: 'abc',
  allowScript: true,
});
```

## `Server`

### `server.addFunction(fn, config)`

- `fn` <[function] ([Request](#request))>
- `config` <[Object]>
  - `functionType` <[FunctionType]> Type of function
  - `returnType` <[DataType]> Type of data this function is expected to return
  - `params` <[Array]<[Object]>>
    - `name` <[string]>
    - `dataType`: <[DataType]>
  - `tableDescription` <[TableDescription]> Description of the returned table when function is called from load script using the `extension` clause.

Register a function which can be called from an expression.

```js
const fn = (request) => {/* do stuff */};
server.addFunction(fn, {
  functionType: q.sse.FunctionType.TENSOR,
  returnType: q.sse.DataType.NUMERIC,
  params: [{
    name: 'first',
    dataType: q.sse.DataType.NUMERIC
  }]
})
```

### `server.start(options)`

- `options` <[Object]>
  - `port` <[number]> Port to run the server on. Defaults to `50051`.

Starts the server.

## `Request`

### `request.on(event, fn)`

- `event` <[string]> Name of event to listen to. Possible values: `data`.
- `fn` <[function] ([BundledRows])>

```js
request.on('data', (bundle) => {/* deal with bundle*/})
```

### `request.write(bundle)`

- `bundle` <[BundledRows]>

Writes data back to Qlik Engine.

```js
request.on('data', (bundle) => {
  const returnBundle = {/* */};
  request.write(returnBundle);
});
```


[Array]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array "Array"
[boolean]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Boolean_type "Boolean"
[function]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Function "Function"
[number]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#Number_type "Number"
[Object]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object "Object"
[string]: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Data_structures#String_type "String"
