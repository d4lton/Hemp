/**
 * Hemp
 * Base Element
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

function Element() {
};

/************************************************************************************/

Element.prototype.render = function(environment, object) {
  this.setupCanvas(environment, object);
  this.renderElement(environment, object);
  this.renderCanvas(environment, object);
};

Element.prototype.setupCanvas = function(environment, object) {
  if (!this._canvas) {
    this._canvas = document.createElement('canvas');
    this._context = this._canvas.getContext('2d');
  }
  this._canvas.width = object.width;
  this._canvas.height = object.height;
  this._context.clearRect(0, 0, this._canvas.width, this._canvas.height);
  if (object.backgroundColor) {
    this._context.save();
    this._context.fillStyle = this.resolveColor(environment, object.backgroundColor);
    this._context.fillRect(0, 0, object.width, object.height);
    this._context.restore();
  }
};

Element.prototype.renderElement = function(environment, object) {
  console.warn('override me');
};

Element.prototype.renderCanvas = function(environment, object) {
  environment.context.save();
  environment.context.translate(object.x, object.y);
  if (typeof object.rotation !== 'undefined' && object.rotation != 0) {
    environment.context.rotate(object.rotation * Math.PI / 180);
  }
  if (typeof object.opacity !== 'undefined' && object.opacity != 1) {
    environment.context.globalAlpha = object.opacity;
  }
  environment.context.drawImage(this._canvas, -object.width / 2, -object.height / 2);
  environment.context.restore();
};

Element.prototype.resolveColor = function(environment, color) {
  if (environment.options && environment.options.selectionRender) {
    return 'black';
  } else {
    return color;
  }
};

Element.getTypes = function() {
  console.warn('override me');
};

export default Element;