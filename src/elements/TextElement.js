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

TextElement.prototype.getTypes = function() {
  return [
    {
      type: 'text',
      displayName: 'Text'
    }
  ];
};

TextElement.prototype.getProperties = function() {
  var common = Object.getPrototypeOf(this.constructor.prototype).getProperties.call(this);
  var properties = {
    'text': [
      {
        name: 'text',
        displayName: 'Text',
        type: 'string',
        default: ''
      },
      {
        name: 'fontFamily',
        displayName: 'Font',
        type: 'dropdown',
        default: 'serif',
        values: [{name: 'Serif', value: 'serif'}]
      },
      {
        name: 'fontSize',
        displayName: 'Font Size',
        type: 'dropdown',
        default: '50',
        values: [{name: '50', value: '50'}]
      },
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

export default TextElement;