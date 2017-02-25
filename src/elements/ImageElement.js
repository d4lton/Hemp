/**
 * Hemp
 * Image Element
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

import Element from './Element.js';

function ImageElement() {
  Element.call(this);
};

ImageElement.prototype = Object.create(Element.prototype);
ImageElement.prototype.constructor = ImageElement;

/************************************************************************************/

ImageElement.prototype._getFillSourceAndOffset = function(src, dst) {
  var sourceWidth = src.width;
  var sourceHeight = sourceWidth * (dst.height / dst.width);
  if (sourceWidth > src.width) {
    sourceHeight = src.width * (dst.height / dst.width);
    sourceWidth = src.width;
  }
  if (sourceHeight > src.height) {
    sourceWidth = src.height * (dst.width / dst.height);
    sourceHeight = src.height;
  }
  var offsetX = Math.max(0, src.width - sourceWidth) / 2;
  var offsetY = Math.max(0, src.height - sourceHeight) / 2;
  return {
    source: {
      width: sourceWidth,
      height: sourceHeight
    },
    offset: {
      x: offsetX,
      y: offsetY
    }
  };
};

ImageElement.prototype.renderElement = function(environment, object) {
  try {
    if (object.image) {
      var sourceAndOffset = this._getFillSourceAndOffset(object.image, object);
      this._context.drawImage(object.image, sourceAndOffset.offset.x, sourceAndOffset.offset.y, sourceAndOffset.source.width, sourceAndOffset.source.height, 0, 0, object.width, object.height);
    }
  } catch (e) {
  }
};

ImageElement.getTypes = function() {
  return [
    {
      type: 'image',
      displayName: 'Static Image',
      properties: [
        {
          name: 'url',
          displayName: 'URL',
          type: 'url',
          default: ''
        },
        {
          name: 'position',
          displayName: 'Position',
          type: 'integers',
          properties: [
            {
              name: 'x',
              displayName: 'X',
              default: 0
            },
            {
              name: 'y',
              displayName: 'Y',
              default: 0
            }
          ]
        },
        {
          name: 'size',
          displayName: 'Size',
          type: 'integers',
          properties: [
            {
              name: 'width',
              displayName: 'W',
              default: 200
            },
            {
              name: 'height',
              displayName: 'H',
              default: 200
            }
          ]
        },
        {
          name: 'rotation',
          displayName: 'Rotation',
          type: 'slider',
          min: -180,
          max: 180,
          step: 1,
          scale: 1,
          default: 0
        },
        {
          name: 'opacity',
          displayName: 'Opacity',
          type: 'slider',
          min: 0,
          max: 100,
          step: 1,
          scale: 100,
          default: 1
        }
      ]
    }
  ];
};

export default ImageElement;