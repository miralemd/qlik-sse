function getArgType(types, sse) {
  if (types.every(t => t === sse.DataType.NUMERIC)) {
    return sse.DataType.NUMERIC;
  }
  if (types.every(t => t === sse.DataType.STRING)) {
    return sse.DataType.STRING;
  }
  return sse.DataType.DUAL;
}

function getEvaluateScript({ config, sse, grpc }) {
  return function evaluateScript(request) {
    const scriptHeader = sse.ScriptRequestHeader.decode(request.metadata.get('qlik-scriptrequestheader-bin')[0]);
    const common = sse.CommonRequestHeader
      .decode(request.metadata.get('qlik-commonrequestheader-bin')[0]);

    const fn = new Function('args', 'params', 'common', scriptHeader.script); // eslint-disable-line no-new-func
    const { functionType, returnType, params } = scriptHeader;
    const types = params.map(p => p.dataType);

    const argType = types.length ? getArgType(types, sse) : returnType;

    let ff = `script${functionType === sse.FunctionType.AGGREGATION ? 'Aggr' : 'Eval'}`;
    ff += `${argType === sse.DataType.DUAL ? 'Ex' : ''}${returnType === sse.DataType.STRING ? 'Str' : ''}`;

    // allowScript: {
    //   scriptEval: true,
    //   scriptEvalStr: true,
    //   scriptAggr: true,
    //   scriptAggrStr: true,
    //   // ----
    //   scriptEvalEx: true,
    //   scriptEvalExStr: true,
    //   scriptAggrEx: true,
    //   scriptAggrExStr: true,
    // }

    if (typeof config.allowScript === 'object' && !config.allowScript[ff]) {
      request.call.cancelWithStatus(grpc.status.UNIMPLEMENTED, `'${ff}' not allowed.`);
      request.end();
      return;
    }

    const dualProp = returnType === sse.DataType.STRING ? 'strData' : 'numData';

    const typesProp = types.map(t => (t === sse.DataType.STRING ? 'strData' : t === sse.DataType.NUMERIC ? 'numData' : ''));
    const typeMap = (d, i) => (typesProp[i] ? d[typesProp[i]] : d);

    if (functionType === sse.FunctionType.AGGREGATION) {
      request.on('data', (bundle) => {
        const args = bundle.rows.map(row => row.duals.map(typeMap));
        const v = fn(args, params, common);

        request.write({
          rows: [{
            duals: [{
              [dualProp]: returnType === sse.DataType.STRING ? String(v) : Number(v),
            }],
          }],
        });
      });
      request.on('end', () => request.end());
    } else {
      request.on('data', (bundle) => {
        const rows = [];
        bundle.rows.forEach((row) => {
          const args = row.duals.map(typeMap);
          const v = fn(args, params, common);
          rows.push({
            duals: [{
              [dualProp]: returnType === sse.DataType.STRING ? String(v) : Number(v),
            }],
          });
        });
        request.write({ rows });
      });
      request.on('end', () => request.end());
    }
  };
}

module.exports = {
  getArgType,
  getEvaluateScript,
};
