const funcs = ({ sse, grpc }) => {
  const functions = [];
  const functionMap = {};
  let expando = 1000;

  const f = {
    list() {
      return functions;
    },
    add(fn, fnConfig) {
      const name = fnConfig.name || fn.name;
      functions.push({
        name,
        functionType: fnConfig.functionType,
        returnType: fnConfig.returnType,
        params: fnConfig.params,
        functionId: ++expando,
      });
      functionMap[expando] = fn;
    },
    execute(request) {
      const funcionHeader = sse.FunctionRequestHeader.decode(request.metadata.get('qlik-functionrequestheader-bin')[0]);
      if (functionMap[funcionHeader.functionId]) {
        functionMap[funcionHeader.functionId](request);
      }

      request.on('end', () => request.end());
    },
  };

  return f;
};

module.exports = funcs;
