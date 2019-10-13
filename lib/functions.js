const funcs = ({ sse, grpc, log }) => {
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
      const fn = functionMap[funcionHeader.functionId];
      if (fn) {
        try {
          fn(request);
        } catch (e) {
          log.error(e);
          request.call.cancelWithStatus(grpc.status.UNKNOWN, e.message);
        }
      } else {
        request.call.cancelWithStatus(grpc.status.UNIMPLEMENTED, 'The method is not implemented.');
        return;
      }

      if (fn.constructor.name !== 'AsyncFunction') {
        request.on('end', () => request.end());
      }
    },
  };

  return f;
};

module.exports = funcs;
