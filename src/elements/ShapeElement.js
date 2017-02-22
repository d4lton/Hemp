/**
 * Hemp
 * Shape Element
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

import Element from './Element.js';

function ShapeElement(environment, object) {
  Element.call(this, environment, object);
};

ShapeElement.prototype = Object.create(Element.prototype);
ShapeElement.prototype.constructor = ShapeElement;

/************************************************************************************/

ShapeElement.prototype.renderElement = function() {
  switch (this._object.type) {
    case 'rectangle':
      this.renderRectangle();
      break;
    case 'ellipse':
      this.renderEllipse();
      break;
    default:
      throw new Error('Unknown shape type: ' + this._object.type);
  }
};

ShapeElement.prototype.renderRectangle = function() {
  this._context.save();
  this._context.fillStyle = this.resolveColor(this._object.color);
  this._context.fillRect(0, 0, this._object.width, this._object.height);
  this._context.restore();
};

ShapeElement.prototype.renderEllipse = function() {
  this._context.save();

  this._context.save();
  this._context.beginPath();
  this._context.scale(this._object.width / 2, this._object.height / 2);
  this._context.arc(1, 1, 1, 0, 2 * Math.PI, false);
  this._context.restore();

  this._context.fillStyle = this.resolveColor(this._object.color);
  this._context.fill();

  this._context.restore();
};

export default ShapeElement;