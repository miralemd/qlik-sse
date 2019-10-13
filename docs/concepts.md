# Server side extensions

Qlik's Server Side Extension feature enables you to extend the engine with custom calculations.

There are two ways you can do this; by defining custom functions, and by enabling runtime script evaluation.

## Functions

[Intro](https://github.com/qlik-oss/server-side-extension/blob/master/docs/writing_a_plugin.md#function-evaluation)

Functions are defined based on the input type you expect them to have and could be one of scalar, aggregation or tensor.

To explain them, we're going to assume we have the following data model:

Product group | Product | Sales
---|---|---
Snack|Chips|19
Snack|Popcorn|11
Snack|Cookies|18
Dairy|Cheese|12

```basic
Prods:
LOAD * Inline [
Product group,Product,Sales
Snack, Chips, 19
Snack, Popcorn, 11
Snack, Cookies, 18
Dairy, Cheese, 12
];
```

Data in SSE is received in the shape of `bundle`s:

```js
const bundle = {
  rows: [{
    duals: [{ // columns
      numData, // numerical value of the dual
      strData, // string value of the dual
    }, /* ... */]
  }, /* ... */]
];
```

### Tensor (and Scalar)

Tensor is used when there is a one-to-one relationship between the fields in the cube and the expressions you provide to the SSE function.

If we use _Product group_ as dimension and pass in _sum(Sales)_ as a parameter to the function, we would receive one bundle with one row per _Product group_:

- `[48, 12]`

**Example**

The following example returns the value 'green' if the value of the expression _sum(Sales)_ is > 20, otherwise it returns 'red'.

The expression:

```basic
sse.color(sum(Sales));
```

The SSE function:
```js
function greenOrRed(request) {
  request.on('data', (bundle) => {
    const rows = [];
    bundle.rows.forEach((row) => {
      rows.push({ // for each row in the input bundle
        duals: [{ // we add one row to the output, containing only one dual
          // that dual must contain 'strData' because the return type of this function is STRING
          strData: row.duals[0].numData > 20 ? 'green' : 'red' // numData is expected to be valid since the dataType of the first param is NUMERIC
        ],
      });
    });
    request.write({ rows }); // send data back to Qlik engine
  }
}

// register the function
server.addFunction(greenOrRed, {
  functionType: q.sse.FunctionType.TENSOR,
  returnType: q.sse.DataType.STRING,
  name: 'color', // optional, if not specified the name will be the function itself ('greenOrRed')
  params: [{
    name: 'first',
    dataType: q.sse.DataType.NUMERIC
  }]
})
```

### Aggregation

Aggregation is used when there is a one-to-many relationship between the fields in the cube and the expressions you provide to the SSE function. Common use cases are calculating sum, avg, concatenation etc.

If we use _Product group_ as dimension and pass in _Sales_ as a parameter to the function, we would receive three bundles:

- For _Product group_ `'Snacks'`: `[19, 11, 18]`
- For _Product group_ `'Dairy'`: `[12]`
- For _total_: `[19, 11, 18, 12]`

**Example**

If we want to calculate the _sum_ of _Sales_ for each _Product group_, we simply aggregate the rows in each bundle:

```js
(bundle) => {
  let v = 0;
  bundle.rows.forEach((row) => {
    row.duals.forEach((dual) => {
      v += dual.numData;
    });
  });
  request.write({
    rows: [{ // return only one row, containing one dual
      duals: [{ numData: v }],
    }],
  });
}
```

## Script evaluation

<p style="background:#fdd;padding: 12px;">
<strong>Note! Enabling script evaluation is <a style="color:#900;text-decoration:underline"href="https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/eval#Do_not_ever_use_eval!">dangerous!</a></strong>
</p>

[Intro](https://github.com/qlik-oss/server-side-extension/blob/master/docs/writing_a_plugin.md#script-evaluation)

Script evaluation makes it easy to run some basic arithmetic and string manipulation.

To simplify the access to values inside scripts:

- bundles are first remapped into an `args` parameter. The values inside `args` are:
  - strings when parameter type is STRING
  - numbers when parameter type is NUMERIC
  - dual when parameter type is DUAL
- the script is evaluated by wrapping it inside a function:
  ```js
  function(args, params, common) {
    // script evaluated here
  }
  ```
  - `args` may be one of
    - `(string | number | dual)[][]` - when any of the `*Aggr` functions are called
    - `(string | number | dual)[]`
  - `params` <[Parameter](https://github.com/qlik-oss/server-side-extension/blob/master/docs/SSE_Protocol.md#qlik.sse.Parameter)[]>
  - `common` <[CommonRequestHeader](https://github.com/qlik-oss/server-side-extension/blob/master/docs/SSE_Protocol.md#qlik.sse.CommonRequestHeader)>
- values are then remapped back to appropriate bundles

**Example**

Calculate the sum of _Sales_ per _Product Group_:

```basic
HelloSSE.ScriptAggr('return args.reduce((prev, curr) => (prev + curr[0]), 0)', 'Sales')
```

In this example we're using one of the `*Aggr` functions, the value of `args` will then be:

- For _Product group_ `'Snacks'`: `[[19], [11], [18]]`
- For _Product group_ `'Dairy'`: `[[12]]`
- For _total_: `[[19], [11], [18], [12]`

**Example**

Return 'green' if the value of the expression _sum(Sales)_ is > 20, otherwise return 'red'.

```basic
sse.ScriptEvalExStr('N', 'return args[0] > 20 ? "green" : "red"', sum(Sales));
```

`args` will in this case be:

- For _Product group_ `'Snacks'`: `[48]`
- For _Product group_ `'Dairy'`: `[12]`

In this example, we use `*Ex` because we want to get the numeric value of `sum(Sales)` by specifying `N` as the first parameter. The values inside `args` will therefore be the `numData` part of the `dual`. We use `*Str` because we want a `string` as output.

## Table load

[Intro](https://github.com/qlik-oss/server-side-extension/blob/master/docs/writing_a_plugin.md#tabledescription)

It's possible to load entire tables and augment script data through a table load defined in the script.

**Example**

Let's first define a function that has a table description and returns additional columns of data:

```js
const NUTRITIONAL_FACTS = {
  // protein, fat, carbs (in grams)
  Cheese: [20, 25, 4],
  Popcorn: [12, 4, 78],
  Chips: [7, 35, 53],
  Cookies: [6, 24, 65],
};

function nutrition(request) {
  request.on('data', (bundle) => {
    const rows = [];
    bundle.rows.forEach((row) => {
      const c = NUTRITIONAL_FACTS[row.duals[0].strData];
      rows.push({
        duals: [
          { strData: row.duals[0].strData }, // first column - product
          { numData: c ? c[0] : '-' }, // second column - protein
          { numData: c ? c[1] : '-' }, // third column - fat
          { numData: c ? c[2] : '-' }, // fourth column - carbs
        ],
      });
    });
    request.write({ rows });
  });
}

s.addFunction(nutrition, {
  functionType: q.sse.FunctionType.TENSOR,
  // returnType: q.sse.DataType.NUMERIC, // returnType doesn't matter when called with the 'extension' clause
  params: [{
    name: 'does not matter',
    dataType: q.sse.DataType.STRING,
  }],
  tableDescription: { // describe the table this function is expected to return
    fields: [
      { dataType: q.sse.DataType.STRING, name: 'Product'},
      { dataType: q.sse.DataType.NUMERIC, name: 'protein'},
      { dataType: q.sse.DataType.NUMERIC, name: 'fat'},
      { dataType: q.sse.DataType.NUMERIC, name: 'carbs'}
    ],
  },
});
```

In the load script we can then load that additional data using the `Load ... Extension` syntax:

```basic
Prods:
LOAD * Inline [
Product group,Product,Sales
Snack, Chips, 19
Snack, Popcorn, 11
Snack, Cookies, 18
Dairy, Cheese, 12

Load * Extension sse.nutrition( Prods{Product} );
];
```

which will result in the following table being added to the data model:

Product | fat | protein | carbs
---|---|---|---
Chips|20|25|4
Popcorn|12|4|78
Cookies|7|35|53
Cheese|6|24|65
