/**
 * Hemp
 * Shape Element
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

import Element from './Element.js';

function ShapeElement() {
  Element.call(this);
};

ShapeElement.prototype = Object.create(Element.prototype);
ShapeElement.prototype.constructor = ShapeElement;

/************************************************************************************/

ShapeElement.prototype.renderElement = function(environment, object, options) {
  switch (object.type) {
    case 'rectangle':
      this.renderRectangle(environment, object);
      break;
    case 'ellipse':
      this.renderEllipse(environment, object);
      break;
    default:
      throw new Error('Unknown shape type: ' + object.type);
  }
};

ShapeElement.prototype.renderRectangle = function(environment, object) {
  this._context.save();
  this._context.fillStyle = this.resolveColor(environment, object.color);
  this._context.fillRect(0, 0, object.width, object.height);
  this._context.restore();
};

ShapeElement.prototype.renderEllipse = function(environment, object) {
  this._context.save();

  this._context.save();
  this._context.beginPath();
  this._context.scale(object.width / 2, object.height / 2);
  this._context.arc(1, 1, 1, 0, 2 * Math.PI, false);
  this._context.restore();

  this._context.fillStyle = this.resolveColor(environment, object.color);
  this._context.fill();

  this._context.restore();
};

ShapeElement.prototype.getTypes = function() {
  return [
    {
      type: 'rectangle',
      displayName: 'Rectangle'
    },
    {
      type: 'ellipse',
      displayName: 'Ellipse'
    }
  ];
};

ShapeElement.prototype.getProperties = function() {
  var common = Object.getPrototypeOf(this.constructor.prototype).getProperties.call(this);
  var properties = {
    'rectangle': [
      {
        name: 'color',
        displayName: 'Color',
        type: 'string'
      }
    ],
    'ellipse': [
      {
        name: 'color',
        displayName: 'Color',
        type: 'string'
      }
    ]
  };
  Object.keys(properties).forEach(function(type) {
    properties[type] = properties[type].concat(common.common);
  });
  return properties;
};

export default ShapeElement;