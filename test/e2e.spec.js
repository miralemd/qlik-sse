const grpc = require('grpc');
const { server, sse } = require('../lib/index');

function duplicate(request) {
  request.on('data', (bundle) => {
    const rows = [];
    bundle.rows.forEach((row) => {
      row.duals.forEach((dual) => {
        rows.push({
          duals: [{ numData: dual.numData * 2 }],
        });
      });
    });
    request.write({ rows });
  });
}

async function later(request) {
  request.on('data', (bundle) => {
    const rows = [];
    setTimeout(() => {
      bundle.rows.forEach((row) => {
        row.duals.forEach((dual) => {
          rows.push({
            duals: [{ strData: dual.strData.toUpperCase() }],
          });
        });
      });
      request.write({ rows });
      request.end();
    }, 200);
  });
}

describe('e2e', () => {
  let s;
  let c;
  before(() => {
    s = server({
      identifier: 'xxx',
      version: '0.1.0',
      allowScript: true,
      logLevel: 0,
    });

    s.addFunction(duplicate, { // eslint-disable-line
      functionType: sse.FunctionType.SCALAR,
      returnType: sse.DataType.NUMERIC,
      params: [{
        name: 'first',
        dataType: sse.DataType.NUMERIC,
      }],
    });

    s.addFunction(later, { // eslint-disable-line
      functionType: sse.FunctionType.SCALAR,
      returnType: sse.DataType.STRING,
      params: [{
        name: 'first',
        dataType: sse.DataType.STRING,
      }],
    });

    s.start({
      port: 5001,
    });

    c = new sse.Connector('0.0.0.0:5001', grpc.credentials.createInsecure());
  });

  after(() => {
    s.close();
  });

  describe('getCapabilities', () => {
    it('should return a Capabilities object', (done) => {
      c.getCapabilities(new sse.Empty(), (x, cap) => {
        const type = () => new sse.Capabilities(cap);
        expect(type).to.not.throw();
        expect(cap).to.eql({
          allowScript: true,
          functions: [{
            name: 'duplicate',
            functionType: 'SCALAR',
            returnType: 'NUMERIC',
            params: [{ dataType: 'NUMERIC', name: 'first' }],
            functionId: 1001,
          }, {
            name: 'later',
            functionType: 'SCALAR',
            returnType: 'STRING',
            params: [{ dataType: 'STRING', name: 'first' }],
            functionId: 1002,
          }],
          pluginIdentifier: 'xxx',
          pluginVersion: '0.1.0',
        });
        done();
      });
    });
  });

  describe('executeFunction', () => {
    it('should duplicate numbers', (done) => {
      const fmh = new sse.FunctionRequestHeader({
        functionId: 1001,
      }).encodeNB();

      const metadata = new grpc.Metadata();
      metadata.set('qlik-functionrequestheader-bin', fmh);

      const b = new sse.BundledRows({
        rows: [{
          duals: [{
            numData: 7,
          }],
        }],
      });

      const e = c.executeFunction(metadata);

      let data = {};
      const assert = () => {
        expect(data.rows).to.eql([{ duals: [{ numData: 14, strData: '' }] }]);
        done();
      };

      e.on('data', (d) => { data = d; });

      e.on('end', assert);

      e.write(b);
      e.end();
    });

    it('should emit UMIMPLEMENTED error when method is not found', (done) => {
      const fmh = new sse.FunctionRequestHeader({
        functionId: 99,
      }).encodeNB();

      const metadata = new grpc.Metadata();
      metadata.set('qlik-functionrequestheader-bin', fmh);

      const e = c.executeFunction(metadata);

      e.on('data', () => {});
      e.on('error', (err) => {
        expect(err.code).to.equal(grpc.status.UNIMPLEMENTED);
        expect(err.details).to.equal('The method is not implemented.');
        done();
      });
      e.end();
    });

    it('should support async function', (done) => {
      const fmh = new sse.FunctionRequestHeader({
        functionId: 1002,
      }).encodeNB();

      const metadata = new grpc.Metadata();
      metadata.set('qlik-functionrequestheader-bin', fmh);

      const b = new sse.BundledRows({
        rows: [{
          duals: [{
            strData: 'cap me',
          }],
        }],
      });

      const e = c.executeFunction(metadata);

      let data = {};
      const assert = () => {
        expect(data.rows).to.eql([{ duals: [{ numData: 0, strData: 'CAP ME' }] }]);
        done();
      };

      e.on('data', (d) => { data = d; });

      e.on('end', assert);

      e.write(b);
      e.end();
    });
  });

  describe('executeScript', () => {
    it('should duplicate numbers', (done) => {
      const sh = new sse.ScriptRequestHeader({
        script: 'return args[0] * 2',
        functionType: sse.FunctionType.SCALAR,
        returnType: sse.DataType.NUMERIC,
        params: [{ dataType: sse.DataType.NUMERIC, name: 'f' }],
      }).encodeNB();

      const ch = new sse.CommonRequestHeader({
        appId: 'aa',
        userId: 'uu',
        cardinality: 55,
      }).encodeNB();

      const metadata = new grpc.Metadata();
      metadata.set('qlik-scriptrequestheader-bin', sh);
      metadata.set('qlik-commonrequestheader-bin', ch);

      const b = new sse.BundledRows({
        rows: [{
          duals: [{
            numData: 6,
          }],
        }],
      });

      const e = c.evaluateScript(metadata);

      e.on('data', ({ rows }) => {
        expect(rows).to.eql([{ duals: [{ numData: 12, strData: '' }] }]);
      });

      e.on('end', done);

      e.write(b);
      e.end();
    });
  });
});
