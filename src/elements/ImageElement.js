/**
 * Hemp
 * Image Element
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

import Element from './Element.js';

function ImageElement(environment, object) {
  Element.call(this, environment, object);
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

ImageElement.prototype.renderElement = function() {
  var sourceAndOffset = this._getFillSourceAndOffset(this._object.image, this._object);
  this._context.drawImage(this._object.image, sourceAndOffset.offset.x, sourceAndOffset.offset.y, sourceAndOffset.source.width, sourceAndOffset.source.height, 0, 0, this._object.width, this._object.height);
};

ImageElement.prototype.getTypes = function() {
  return [
    {
      type: 'image',
      displayName: 'Static Image'
    }
  ];
};

ImageElement.prototype.getProperties = function() {
  var common = Object.getPrototypeOf(this.constructor.prototype).getProperties.call(this);
  var properties = {
    'image': [
      {
        name: 'url',
        displayName: 'URL',
        type: 'url',
        default: ''
      }
    ]
  };
  Object.keys(properties).forEach(function(type) {
    properties[type] = properties[type].concat(common.common);
  });
  return properties;
};

export default ImageElement;