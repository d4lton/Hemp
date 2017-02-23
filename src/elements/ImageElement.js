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

ImageElement.prototype.renderElement = function() {
  //var sourceAndOffset = Utilities.getFillSourceAndOffset(object.image, object);
  //this.context.drawImage(object.image, sourceAndOffset.offset.x, sourceAndOffset.offset.y, sourceAndOffset.source.width, sourceAndOffset.source.height, 0, 0, object.width, object.height);
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