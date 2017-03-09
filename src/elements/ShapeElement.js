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

ShapeElement.prototype.renderElement = function(environment, object) {
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
  this._context.fillStyle = this.resolveColor(environment, object.color, object.alpha);
  this._fillRoundRect(this._context, 0, 0, object.width, object.height, this.resolveRadius(object.radius));
};

ShapeElement.prototype.renderEllipse = function(environment, object) {
  this._context.save();
  this._context.beginPath();
  this._context.scale(object.width / 2, object.height / 2);
  this._context.arc(1, 1, 1, 0, 2 * Math.PI, false);
  this._context.restore();

  this._context.fillStyle = this.resolveColor(environment, object.color, object.alpha);
  this._context.fill();
};

ShapeElement.getTypes = function() {
  return {
    rectangle: {
      displayName: 'Rectangle',
      properties: [
        {
          displayName: 'Color',
          type: 'group',
          properties: [
            {
              name: 'color',
              displayName: '',
              type: 'color',
              default: '#000000'
            },
            {
              name: 'alpha',
              displayName: '',
              type: 'range',
              min: 0,
              max: 1,
              step: 0.01,
              default: 1,
              width: 50
            },
            {
              name: 'radius',
              displayName: 'rad',
              type: 'integer',
              default: 0
            },
          ]
        },
        {
          name: 'position',
          displayName: 'Position',
          type: 'group',
          properties: [
            {
              type: 'integer',
              name: 'x',
              displayName: 'X',
              default: 120
            },
            {
              type: 'integer',
              name: 'y',
              displayName: 'Y',
              default: 120
            }
          ]
        },
        {
          name: 'size',
          displayName: 'Size',
          type: 'group',
          properties: [
            {
              type: 'integer',
              name: 'width',
              displayName: 'W',
              default: 200
            },
            {
              type: 'integer',
              name: 'height',
              displayName: 'H',
              default: 200
            }
          ]
        },
        {
          displayName: 'Rotation',
          type: 'group',
          properties: [
            {
              name: 'rotation',
              displayName: '',
              type: 'range',
              min: 0,
              max: 360,
              step: 1,
              default: 0,
              width: 60
            },
            {
              name: 'rotation',
              displayName: '',
              type: 'integer',
              default: 0,
              width: 32
            }
          ]
        },
        {
          name: 'opacity',
          displayName: 'Opacity',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.01,
          default: 1
        }
      ]
    },
    ellipse: {
      displayName: 'Ellipse',
      properties: [
        {
          displayName: 'Color',
          type: 'group',
          properties: [
            {
              name: 'color',
              displayName: '',
              type: 'color',
              default: '#000000'
            },
            {
              name: 'alpha',
              displayName: '',
              type: 'range',
              min: 0,
              max: 1,
              step: 0.01,
              default: 1,
              width: 50
            }
          ]
        },
        {
          displayName: 'Background',
          type: 'group',
          properties: [
            {
              name: 'backgroundColor',
              displayName: '',
              type: 'color',
              default: '#000000'
            },
            {
              name: 'backgroundAlpha',
              displayName: '',
              type: 'range',
              min: 0,
              max: 1,
              step: 0.01,
              default: 1,
              width: 50
            },
            {
              name: 'backgroundRadius',
              displayName: 'rad',
              type: 'integer',
              default: 0
            },
          ]
        },
        {
          name: 'position',
          displayName: 'Position',
          type: 'group',
          properties: [
            {
              type: 'integer',
              name: 'x',
              displayName: 'X',
              default: 120
            },
            {
              type: 'integer',
              name: 'y',
              displayName: 'Y',
              default: 120
            }
          ]
        },
        {
          name: 'size',
          displayName: 'Size',
          type: 'group',
          properties: [
            {
              type: 'integer',
              name: 'width',
              displayName: 'W',
              default: 200
            },
            {
              type: 'integer',
              name: 'height',
              displayName: 'H',
              default: 200
            }
          ]
        },
        {
          displayName: 'Rotation',
          type: 'group',
          properties: [
            {
              name: 'rotation',
              displayName: '',
              type: 'range',
              min: 0,
              max: 360,
              step: 1,
              default: 0,
              width: 60
            },
            {
              name: 'rotation',
              displayName: '',
              type: 'integer',
              default: 0,
              width: 32
            }
          ]
        },
        {
          name: 'opacity',
          displayName: 'Opacity',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.01,
          default: 1
        }
      ]
    }
  };
};

export default ShapeElement;