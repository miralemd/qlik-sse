import enigma from 'enigma.js';
import schema from 'enigma.js/schemas/3.2.json';
import nucleus from '@nebula.js/nucleus/dist/nucleus';

import scatterplot from './scatterplot';
import qscript from './mouse';

const connect = () => enigma.create({
  schema,
  url: `ws://${window.location.hostname || 'localhost'}:9076/app/${Date.now()}`,
}).open().then(qix => qix.createSessionApp().then(app => app.setScript(qscript).then(() => app.doReload().then(() => app))));

connect().then((app) => {
  const n = nucleus(app, {
    types: [{
      name: 'scatter',
      load: () => Promise.resolve(scatterplot),
    }],
  });

  n.selections().mount(document.querySelector('#selections'));

  n.create({
    type: 'scatter',
  }, {
    element: document.querySelector('#object'),
    properties: {
      qHyperCubeDef: {
        qInitialDataFetch: [{
          qWidth: 4,
          qHeight: 2000,
        }],
        qDimensions: [{
          qDef: {
            qFieldDefs: ['sample'],
          },
          qAttributeDimensions: [{
            qDef: 'body_part',
          }],
        }],
        qMeasures: [
          { qDef: { qDef: 'x' } },
          { qDef: { qDef: 'y' } },
          { qDef: { qDef: 'sse.cluster(x, y, 3)' } },
        ],
      },
      showTitles: true,
      subtitle: 'Shape indicates actual group the point belongs to, while color indicates the group according to k-means.',
    },
    context: {
      permissions: ['passive', 'interact', 'select'],
    },
  }).then((viz) => {
    const ctrl = document.querySelector('#numClusters');
    ctrl.addEventListener('change', (e) => {
      document.querySelector('#numClustersLabel').textContent = +ctrl.value;
      viz.setTemporaryProperties({
        qHyperCubeDef: {
          qMeasures: [
            { qDef: { qDef: 'x' } },
            { qDef: { qDef: 'y' } },
            { qDef: { qDef: `sse.cluster(x, y, ${+ctrl.value})` } },
          ],
        },
      });
    });
  });
});
