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
  /*
  if (sourceWidth > src.width) {
    sourceHeight = src.width * (dst.height / dst.width);
    sourceWidth = src.width;
  }
  */
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
  if (object._image) {
    var sourceAndOffset = this._getFillSourceAndOffset(object._image, object);
    this._context.drawImage(object._image, sourceAndOffset.offset.x, sourceAndOffset.offset.y, sourceAndOffset.source.width, sourceAndOffset.source.height, 0, 0, object.width, object.height);
  }
};

ImageElement.getTypes = function() {
  return {
    image: {
      displayName: 'Image',
      properties: [
        {
          name: 'url',
          displayName: 'URL',
          type: 'url',
          default: '{{image_link}}'
        },
        {
          name: 'position',
          displayName: 'Position',
          type: 'group',
          properties: [
            {
              type: 'integer',
              name: 'x',
              displayName: 'X',
              default: 120
            },
            {
              type: 'integer',
              name: 'y',
              displayName: 'Y',
              default: 120
            }
          ]
        },
        {
          name: 'size',
          displayName: 'Size',
          type: 'group',
          properties: [
            {
              type: 'integer',
              name: 'width',
              displayName: 'W',
              default: 200
            },
            {
              type: 'integer',
              name: 'height',
              displayName: 'H',
              default: 200
            }
          ]
        },
        {
          displayName: 'Rotation',
          type: 'group',
          properties: [
            {
              name: 'rotation',
              displayName: '',
              type: 'range',
              min: 0,
              max: 360,
              step: 1,
              default: 0,
              width: 60
            },
            {
              name: 'rotation',
              displayName: '',
              type: 'integer',
              default: 0,
              width: 32
            }
          ]
        },
        {
          name: 'opacity',
          displayName: 'Opacity',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.01,
          default: 1
        }
      ]
    }
  };
};

export default ImageElement;