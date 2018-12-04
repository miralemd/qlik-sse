# Function examples

Read up on the [concept of functions](../docs/concepts.md#functions) first.

Functions need to be registered after the server is created, but before it's started:
```js
const q = require('qlik-sse');

// create an instance of the server
const s = q.server({
  identifier: 'xxx',
  version: '0.1.0',
});

/* ADD FUNCTIONS HERE BEFORE STARTING THE SERVER */

// start the server
s.start({
  port: 50051
});
```

## Examples

### Sum of rows and columns

```js
function sum(request) {
  request.on('data', (bundle) => {
    const rows = [];
    let v = 0;
    bundle.rows.forEach((row) => {
      row.duals.forEach((dual) => {
        if (!Number.isNaN(dual.numData)) {
          v += dual.numData;
        }
      });
    });
    rows.push({
      duals: [{ numData: v }],
    });
    request.write({
      rows: [{  // return only one row, containing one cell
        duals: [{ numData: v }]
      }],
    });
  });
}

// register the function and its types
s.addFunction(sum, {
  functionType: q.sse.FunctionType.AGGREGATION,
  returnType: q.sse.DataType.NUMERIC,
  params: [{
    name: 'num',
    dataType: q.sse.DataType.NUMERIC,
  }],
});
```

### Sum of columns

```js
function sum(request) {
  request.on('data', (bundle) => {
    const rows = [];
    let v = 0;
    bundle.rows.forEach((row) => {
      row.duals.forEach((dual) => {
        if (!Number.isNaN(dual.numData)) {
          v += dual.numData;
        }
      });
    });
    rows.push({
      duals: [{ numData: v }],
    });
    request.write({
      rows: [{  // return only one row, containing one cell
        duals: [{ numData: v }]
      }],
    });
  });
}

// register the function and its types
s.addFunction(sum, {
  functionType: q.sse.FunctionType.AGGREGATION,
  returnType: q.sse.DataType.NUMERIC,
  params: [{
    name: 'num',
    dataType: q.sse.DataType.NUMERIC,
  }],
});
```

### K-means clustering

```js
const kmeans = require('ml-kmeans'); // need to install this dependency

function cluster(request) {
  request.on('data', (bundle) => {
    const pairs = [];
    bundle.rows.forEach((row) => {
      pairs.push([row.duals[0].numData, row.duals[1].numData]);
    });
    const k = kmeans(pairs, 3);
    const rows = k.clusters.map(c => ({
      duals: [{ numData: c }],
    }));
    request.write({ rows });
  });
}

s.addFunction(cluster, {
  functionType: q.sse.FunctionType.TENSOR,
  returnType: q.sse.DataType.NUMERIC,
  params: [{
    name: 'x',
    dataType: q.sse.DataType.NUMERIC,
  }, {
    name: 'y',
    dataType: q.sse.DataType.NUMERIC,
  }, {
    name: 'numClusters',
    dataType: q.sse.DataType.NUMERIC,
  }],
});
```
