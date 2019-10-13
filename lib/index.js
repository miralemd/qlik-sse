const grpc = require('grpc');
const path = require('path');

const funcs = require('./functions');
const { getEvaluateScript } = require('./script');

const { sse } = grpc.load(path.resolve(__dirname, '..', 'assets', 'SSE.proto')).qlik;

/**
 * @param {object} config
 * @param {object|boolean} config.allowScript
 * @param {string} config.identifier
 * @returns {server}
 */
const server = (config) => {
  const functions = funcs({ sse, grpc });

  const evaluateScript = getEvaluateScript({ config, sse, grpc });

  function getCapabilities(request, cb) {
    console.log(`Capabilites of plugin '${config.identifier}'`);
    console.log(`  AllowScript: ${!!config.allowScript}`);
    console.log('  Functions:');
    const type = {
      [sse.DataType.NUMERIC]: 'numeric',
      [sse.DataType.STRING]: 'string',
    };
    functions.list().forEach((f) => {
      console.log(`    ${f.name}(${f.params.map(p => type[p.dataType])}) : ${type[f.returnType]}`);
    });

    cb(null, {
      allowScript: !!config.allowScript,
      functions: functions.list(),
      pluginIdentifier: config.identifier,
      pluginVersion: config.version,
    });
  }

  let grpcServer;

  function start(startConfig = {}) {
    const port = startConfig.port || 50051;
    grpcServer = new grpc.Server();
    grpcServer.addProtoService(sse.Connector.service, {
      getCapabilities,
      executeFunction: functions.execute,
      evaluateScript,
    });

    grpcServer.bind(`0.0.0.0:${port}`, grpc.ServerCredentials.createInsecure());

    grpcServer.start();
    console.log(`Server listening on port ${port}`);
  }

  return {
    start,
    close() {
      return new Promise((resolve, reject) => {
        if (!grpcServer) {
          reject();
        }
        grpcServer.tryShutdown(resolve);
      });
    },
    addFunction: functions.add,
  };
};

module.exports = {
  server,
  sse,
};
