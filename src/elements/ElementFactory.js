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

ElementFactory.getElement = function(environment, object) {
  var element;
  switch (object.type) {
    case 'image':
      element = new ImageElement(environment, object);
      break;
    case 'text':
      element = new TextElement(environment, object);
      break;
    case 'rectangle':
    case 'ellipse':
      element = new ShapeElement(environment, object);
      break;
    case 'transform':
      element = new TransformElement(environment, object);
      break;
    default:
      throw new Error('Element ' + type + ' is not supported');
      break;
  }
  return element;
};

ElementFactory.getElements = function() {
  return [
    ImageElement,
    ShapeElement,
    TextElement
  ];
};

export default ElementFactory;