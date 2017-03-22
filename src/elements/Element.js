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
  if (object.visible !== false || (environment.options && environment.options.selectionRender)) {
    clearTimeout(this._renderTimeout);
    this.setupCanvas(environment, object);
    this.renderElement(environment, object);
    this.renderCanvas(environment, object);
  }
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
    this._context.fillStyle = this.resolveColor(environment, object.backgroundColor, object.backgroundAlpha);
    this._fillRoundRect(this._context, 0, 0, object.width, object.height, this.resolveRadius(object.backgroundRadius));
    this._context.restore();
  }
};

Element.prototype.resolveRadius = function(radius) {
  if (typeof radius !== 'undefined') {
    return radius;
  } else {
    return 0;
  }
};

Element.prototype._fillRoundRect = function(context, x, y, w, h, r) {
  if (w < 2 * r) r = w / 2;
  if (h < 2 * r) r = h / 2;
  context.beginPath();
  context.moveTo(x + r, y);
  context.arcTo(x + w, y, x + w, y + h, r);
  context.arcTo(x + w, y + h, x, y + h, r);
  context.arcTo(x, y + h, x, y, r);
  context.arcTo(x, y, x + w, y, r);
  context.closePath();
  context.fill();
};

Element.prototype.needsPreload = function(object) {
  return false;
}

Element.prototype.preload = function(object, reflectorUrl) {  
}

Element.prototype._resolveMediaUrl = function(url, reflectorUrl) {
  var result = url;
  if (reflectorUrl) {
    result = reflectorUrl.replace('{{url}}', encodeURIComponent(url));
  }
  return result;
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
  if (typeof object.compositing !== 'undefined') {
    environment.context.globalCompositeOperation = object.compositing;
  }
  environment.context.drawImage(this._canvas, -object.width / 2, -object.height / 2);
  environment.context.restore();
};

Element.prototype._renderPlaceholder = function(environment, object) {
  this._context.strokeStyle = '#FFFF80';
  this._context.lineWidth = 10;
  this._context.setLineDash([8, 4]);
  this._context.strokeRect(0, 0, object.width, object.height);
};

Element.prototype.resolveColor = function(environment, color, alpha) {
  if (environment.options && environment.options.selectionRender) {
    return 'black';
  } else {
    if (typeof alpha !== 'undefined') {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
      return 'rgba(' +
        parseInt(result[1], 16) +
        ', ' +
        parseInt(result[2], 16) +
        ', ' +
        parseInt(result[3], 16) +
        ', ' +
        alpha + ')';
    } else {
      return color;
    }
  }
};

Element.prototype._createPrivateProperty = function(object, property, value) {
  Object.defineProperty(object, property, {enumerable: false, configurable: true, writable: true, value: value})
};

Element.getTypes = function() {
  console.warn('override me');
};

export default Element;