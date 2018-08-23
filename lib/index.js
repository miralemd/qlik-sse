const grpc = require('grpc');
const path = require('path');

const { sse } = grpc.load(path.resolve(__dirname, '..', 'assets', 'SSE.proto')).qlik;

const server = new grpc.Server();

const functions = [{
  name: 'sum',
  functionType: sse.FunctionType.AGGREGATION,
  returnType: sse.DataType.NUMERIC,
  params: [{
    name: 'num',
    dataType: sse.DataType.NUMERIC,
  }],
  functionId: 1001,
}];

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

const functionMap = {
  1001: sum,
};

function getCapabilities(request, cb) {
  cb(null, {
    allowScript: false,
    functions,
    pluginIdentifier: 'xxx',
    pluginVersion: '0.1.0',
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

server.addProtoService(sse.Connector.service, {
  getCapabilities,
  executeFunction,
  evaluateScript,
});

server.bind('0.0.0.0:50051', grpc.ServerCredentials.createInsecure());

server.start();
