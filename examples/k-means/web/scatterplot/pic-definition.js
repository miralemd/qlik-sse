export default function picassoDefinition({
  layout,
  context,
}) {
  if (!layout.qHyperCube) {
    throw new Error('Layout is missing a hypercube');
  }
  return {
    scales: {
      x: {
        data: { field: 'qMeasureInfo/0' },
        expand: 0.2,
      },
      y: {
        data: { field: 'qMeasureInfo/1' },
        expand: 0.2,
        invert: true,
      },
      color: {
        data: { extract: { field: 'qMeasureInfo/2' } },
        type: 'categorical-color',
      },
      shape: {
        type: 'categorical-color',
        data: { extract: { field: 'qDimensionInfo/0/qAttrDimInfo/0' } },
        range: ['circle', 'triangle', 'diamond', 'star'],
      },
    },
    components: [{
      type: 'axis',
      dock: 'left',
      scale: 'y',
    }, {
      type: 'text',
      dock: 'left',
      scale: 'y',
      style: {
        text: '$label',
      },
      show: false,
    }, {
      type: 'axis',
      dock: 'bottom',
      scale: 'x',
    }, {
      type: 'text',
      dock: 'bottom',
      scale: 'x',
      style: {
        text: '$label',
      },
      show: false,
    }, {
      type: 'legend-cat',
      dock: 'right',
      align: 'right',
      scale: 'shape',
      settings: {
        item: {
          shape: {
            fill: '#444',
            type(d) {
              return d.resources.scale('shape')(d.datum.value);
            },
          },
        },
      },
      brush: context.permissions.indexOf('interact') !== -1 && context.permissions.indexOf('select') !== -1 ? {
        trigger: [{
          contexts: ['selection'],
        }],
        consume: [{
          context: 'selection',
          style: {
            inactive: {
              opacity: 0.3,
            },
          },
        }],
      } : {},
    }, {
      type: 'point',
      data: {
        extract: {
          field: 'qDimensionInfo/0',
          props: {
            x: { field: 'qMeasureInfo/0' },
            y: { field: 'qMeasureInfo/1' },
            fill: { field: 'qMeasureInfo/2' },
            category: { field: 'qDimensionInfo/0/qAttrDimInfo/0' },
          },
        },
      },
      settings: {
        x: { scale: 'x' },
        y: { scale: 'y' },
        fill: { scale: 'color' },
        size: 0.2,
        shape: { scale: 'shape', ref: 'category' },
      },
      brush: context.permissions.indexOf('interact') !== -1 && context.permissions.indexOf('select') !== -1 ? {
        trigger: [{
          contexts: ['selection'],
        }],
        consume: [{
          context: 'selection',
          style: {
            inactive: {
              opacity: 0.3,
            },
          },
        }],
      } : {},
    }],
  };
}
