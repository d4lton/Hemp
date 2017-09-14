/**
 * Hemp
 * Base Element
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */
import CanvasText from '../CanvasText/CanvasText.js';

function Element() {
};

/************************************************************************************/

Element.prototype.render = function(environment, object) {
  var render = environment.options && environment.options.selectionRender === true ? 'select' : 'normal';
  if (object.visible !== false || (render === 'select')) {
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

  var render = environment.options && environment.options.selectionRender === true ? 'select' : 'normal';
  if (render === 'normal') {
    if (typeof object.opacity !== 'undefined' && object.opacity != 1) {
      environment.context.globalAlpha = object.opacity;
    }
    if (typeof object.compositing !== 'undefined') {
      environment.context.globalCompositeOperation = object.compositing;
    }
  }

  environment.context.drawImage(this._canvas, -object.width / 2, -object.height / 2);
  environment.context.restore();
};

Element.prototype._renderPlaceholder = function(environment, object) {

  // gray background
  this._context.fillStyle = 'rgba(64, 32, 32, 1.0)';
  this._context.fillRect(0, 0, object.width, object.height);

  // draw border
  this._context.strokeStyle = 'rgba(255, 255, 255, 0.5)';
  this._context.lineWidth = 4 * environment.scaling.x;
  this._context.strokeRect(0, 0, object.width, object.height);
  
  // draw crosses
  this._context.strokeStyle = 'rgba(255, 255, 255, 0.25)';
  this._context.lineWidth = 2 * environment.scaling.x;
  this._context.beginPath();
  this._context.moveTo(0, 0);
  this._context.lineTo(object.width, object.height);
  this._context.moveTo(object.width, 0);
  this._context.lineTo(0, object.height);
  this._context.stroke();

  
  if (object._error) {

    // setup text object
    var fontSize = 40 * environment.scaling.x;
    var textObject = {
      x: object.width / 2,
      y: object.height / 2,
      font: fontSize + 'pt sans-serif',
      color: 'rgba(255, 255, 255, 0.75)',
      align: 'center',
      valign: 'middle',
      height: object.height,
      width: object.width
    };

    // draw Text Object's text
    if (object.type === 'text') {
      textObject.text = object.text;
      CanvasText.drawText(this._context, textObject);
    }

    // draw error message
    fontSize = 15 * environment.scaling.x;
    textObject.text = object._error;
    textObject.valign = 'top';
    textObject.font = fontSize + 'pt sans-serif',
    textObject.padding = fontSize;
    CanvasText.drawText(this._context, textObject);
  }

};

Element.prototype.resolveColor = function(environment, color, alpha) {
  var render = environment.options && environment.options.selectionRender === true ? 'select' : 'normal';
  if (render === 'select') {
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
