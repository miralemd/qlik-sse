const grpc = require('grpc');
const path = require('path');

const { sse } = grpc.load(path.resolve(__dirname, '..', 'assets', 'SSE.proto')).qlik;

const server = new grpc.Server();

function getCapabilities(request, cb) {
  console.log('called');
  cb(null, {
    allowScript: false,
    functions: [],
    pluginIdentifier: 'xxx',
    pluginVersion: '0.1.0',
  });
}

function executeFunction() {

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
