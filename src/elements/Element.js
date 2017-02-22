/**
 * Hemp
 * Base Element
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

function Element(environment, object) {
  this._environment = environment;
  this._object = object;
};

/************************************************************************************/

Element.prototype.render = function() {
  this.setupCanvas();
  this.renderElement();
  this.renderCanvas();
};

Element.prototype.setupCanvas = function() {
  this._canvas = document.createElement('canvas');
  this._context = this._canvas.getContext('2d');
  this._canvas.width = this._object.width;
  this._canvas.height = this._object.height;
  if (this._object.backgroundColor) {
    this._context.save();
    this._context.fillStyle = this.resolveColor(this._environment, this._object.backgroundColor);
    this._context.fillRect(0, 0, this._object.width, this._object.height);
    this._context.restore();
  }
};

Element.prototype.renderElement = function() {
  console.warn('override me');
};

Element.prototype.renderCanvas = function() {
  this._environment.context.save();
  this._environment.context.translate(this._object.x, this._object.y);
  if (this._object.rotation) {
    this._environment.context.rotate(this._object.rotation * Math.PI / 180);
  }
  if (typeof this._object.opacity !== 'undefined') {
    this._environment.context.globalAlpha = this._object.opacity;
  }
  this._environment.context.drawImage(this._canvas, -this._object.width / 2, -this._object.height / 2);
  this._environment.context.restore();
};

Element.prototype.resolveColor = function(color) {
  if (this._environment.options && this._environment.options.selectionRender) {
    return 'black';
  } else {
    return color;
  }
}

export default Element;