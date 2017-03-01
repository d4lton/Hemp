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

TextElement.prototype.renderElement = function(environment, object, options) {
  options = (typeof options === 'object') ? options : {};
  if (environment.options && environment.options.selectionRender) {
    options.block = true;
  }
  var text;
  if (options.tokens) {
    text = object.text;
    Object.keys(options.tokens).forEach(function(token) {
      object.text = object.text.replace('{{' + token + '}}', options.tokens[token]);
    });
  }
  CanvasText.drawText(this._context, object, options);
  if (options.tokens) {
    object.text = text;
  }
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