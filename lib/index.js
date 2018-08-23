const grpc = require('grpc');
const path = require('path');

const { sse } = grpc.load(path.resolve(__dirname, '..', 'assets', 'SSE.proto')).qlik;

const server = (config) => {
  const functions = [];
  const functionMap = {};
  let expando = 1000;

  function addFunction(fn, fnConfig) {
    const name = fnConfig.name || fn.name;
    functions.push({
      name,
      functionType: fnConfig.functionType,
      returnType: fnConfig.returnType,
      params: fnConfig.params,
      functionId: ++expando,
    });
    functionMap[expando] = fn;
  }

  function getCapabilities(request, cb) {
    cb(null, {
      allowScript: false,
      functions,
      pluginIdentifier: config.identifier,
      pluginVersion: config.version,
    });
  }

  function executeFunction(request) {
    const funcionHeader = sse.FunctionRequestHeader.decode(request.metadata.get('qlik-functionrequestheader-bin')[0]);

    if (functionMap[funcionHeader.functionId]) {
      functionMap[funcionHeader.functionId](request);
    } else {
      console.error('Unknown functionId: ', funcionHeader.functionId);
      request.end();
    }

    request.on('end', () => request.end());
  }

  function evaluateScript() {

  }

  function start(startConfig = {}) {
    const port = startConfig.port || 50051;
    const grpcServer = new grpc.Server();
    grpcServer.addProtoService(sse.Connector.service, {
      getCapabilities,
      executeFunction,
      evaluateScript,
    });

    grpcServer.bind(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure());

    grpcServer.start();
    console.log(`Server listening on port ${port}`);
  }

  return {
    start,
    addFunction,
  };
};

module.exports = {
  server,
  sse,
};
