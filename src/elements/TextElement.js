/**
 * Hemp
 * Text Element
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

import Element from './Element.js';
import CanvasText from '../CanvasText/CanvasText.js';

function TextElement() {
  Element.call(this);
};

TextElement.prototype = Object.create(Element.prototype);
TextElement.prototype.constructor = TextElement;

/************************************************************************************/

TextElement.prototype.renderElement = function(environment, object) {
  if (environment.options && environment.options.selectionRender) {
    this._context.fillStyle = this.resolveColor(environment, object.color);
    this._context.fillRect(0, 0, object.width, object.height);
    return;
  }
  CanvasText.drawText(this._context, object);
};

TextElement.getTypes = function() {
  return {
    text: {
      displayName: 'Text',
      properties: [
        {
          name: 'text',
          displayName: 'Text',
          type: 'string',
          default: 'Text'
        },
        {
          name: 'font',
          displayName: 'Font',
          type: 'font'
        },
        {
          name: 'color',
          displayName: 'Color',
          type: 'color',
          default: '#000000'
        },
        {
          name: 'align',
          displayName: 'Alignment',
          type: 'spiffy',
          values: [
            {
              value: 'left',
              label: '',
              fontIcon: 'fa fa-align-left'
            },
            {
              value: 'center',
              label: '',
              fontIcon: 'fa fa-align-center'
            },
            {
              value: 'right',
              label: '',
              fontIcon: 'fa fa-align-right'
            }
          ],
          default: 'center'
        },
        {
          name: 'padding',
          displayName: 'Padding',
          type: 'integer',
          default: 2
        },
        {
          name: 'shadowColor',
          displayName: 'Shadow Color',
          type: 'color',
          default: '#000000'
        },
        {
          displayName: 'Shadow',
          type: 'group',
          properties: [
            {
              name: 'shadowOffsetX',
              displayName: 'X',
              type: 'integer',
              default: '2',
              width: 20
            },
            {
              name: 'shadowOffsetY',
              displayName: 'Y',
              type: 'integer',
              default: '2',
              width: 20
            },
            {
              name: 'shadowBlur',
              displayName: 'Blur',
              type: 'integer',
              default: '5',
              width: 20
            }
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


export default TextElement;