const grpc = require('grpc');
const path = require('path');

const funcs = require('./functions');
const { getEvaluateScript } = require('./script');

const { sse } = grpc.load(path.resolve(__dirname, '..', 'assets', 'SSE.proto')).qlik;

const logFn = level => ({
  error: level >= 1 ? console.error : () => {},
  info: level >= 2 ? console.log : () => {},
});

/**
 * @param {object} config
 * @param {object|boolean} config.allowScript
 * @param {string} config.identifier
 * @param {number} [config.logLevel = 2] The log output level
 * @returns {server}
 */
const server = (config) => {
  const functions = funcs({ sse, grpc });
  const log = logFn(typeof config.logLevel === 'number' ? config.logLevel : 2);

  const evaluateScript = getEvaluateScript({
    config, sse, grpc, log,
  });

  function getCapabilities(request, cb) {
    log.info(`Capabilites of plugin '${config.identifier}'`);
    log.info(`  AllowScript: ${!!config.allowScript}`);
    log.info('  Functions:');
    const type = {
      [sse.DataType.NUMERIC]: 'numeric',
      [sse.DataType.STRING]: 'string',
    };
    functions.list().forEach((f) => {
      log.info(`    ${f.name}(${f.params.map(p => type[p.dataType])}) : ${type[f.returnType]}`);
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
    log.info(`Server listening on port ${port}`);
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
