
## Sum

```js
const q = require('qlik-sse');

// create an instance of the server
const s = q.server({
  identifier: 'xxx',
  version: '0.1.0',
});


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
      rows,
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

// start the server
s.start({
  port: 50051
});
```
