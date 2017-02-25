/**
 * Hemp
 * Element Factory
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

import ImageElement from './ImageElement.js';
import TextElement from './TextElement.js';
import ShapeElement from './ShapeElement.js';
import TransformElement from './TransformElement.js';

var ElementFactory = {};

ElementFactory._elementTypeCache = {};

ElementFactory.getElement = function(object) {
  var element;
  if (!ElementFactory._elementTypeCache[object.type]) {
    switch (object.type) {
      case 'image':
        element = new ImageElement();
        break;
      case 'text':
        element = new TextElement();
        break;
      case 'rectangle':
      case 'ellipse':
        element = new ShapeElement();
        break;
      case 'transform':
        element = new TransformElement();
        break;
      default:
        throw new Error('Element ' + type + ' is not supported');
        break;
    }
    ElementFactory._elementTypeCache[object.type] = element;
  }
  return ElementFactory._elementTypeCache[object.type];
};

ElementFactory.getElements = function() {
  return [
    ImageElement,
    ShapeElement,
    TextElement
  ];
};

export default ElementFactory;