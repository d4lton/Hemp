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

// TODO
// make these class functions
// only need one function
// return an array of types this Element can draw
// each element in array should be an object with name, displayName, properties

Element.prototype.getTypes = function() {
  console.warn('override me');
};

Element.prototype.getProperties = function() {
  return {
    'common': [
      {
        name: 'position',
        displayName: 'Position',
        type: 'integers',
        properties: [
          {
            name: 'x',
            displayName: 'X',
            default: 0
          },
          {
            name: 'y',
            displayName: 'Y',
            default: 0
          }
        ]
      },
      {
        name: 'size',
        displayName: 'Size',
        type: 'integers',
        properties: [
          {
            name: 'width',
            displayName: 'W',
            default: 200
          },
          {
            name: 'height',
            displayName: 'H',
            default: 200
          }
        ]
      },
      {
        name: 'rotation',
        displayName: 'Rotation',
        type: 'slider',
        min: -180,
        max: 180,
        step: 1,
        scale: 1,
        default: 0
      },
      {
        name: 'opacity',
        displayName: 'Opacity',
        type: 'slider',
        min: 0,
        max: 100,
        step: 1,
        scale: 100,
        default: 1
      }
    ]
  };
};

export default Element;