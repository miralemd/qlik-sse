const kmeans = require('ml-kmeans');
const q = require('qlik-sse');

const s = q.server({
  identifier: 'xxx',
  version: '0.1.0',
  allowScript: true,
});

function cluster(request) {
  request.on('data', (bundle) => {
    const pairs = [];
    bundle.rows.forEach((row) => {
      pairs.push([row.duals[0].numData, row.duals[1].numData]);
    });
    const num = Math.min(bundle.rows[0].duals[2].numData, pairs.length - 1);
    let rows = [];
    try {
      const k = kmeans(pairs, num);
      rows = k.clusters.map(c => ({
        duals: [{ numData: c }],
      }));
    } catch (e) {
      console.error(e, num);
      rows = pairs.map(() => ({
        duals: [{ numData: 0 }],
      }));
    }
    request.write({ rows });
  });
}

s.addFunction(cluster, {
  functionType: q.sse.FunctionType.TENSOR,
  returnType: q.sse.DataType.NUMERIC,
  params: [{
    name: 'x',
    dataType: q.sse.DataType.NUMERIC,
  }, {
    name: 'y',
    dataType: q.sse.DataType.NUMERIC,
  }, {
    name: 'numClusters',
    dataType: q.sse.DataType.NUMERIC,
  }],
});

// start the server
s.start({
  port: 50051,
});
