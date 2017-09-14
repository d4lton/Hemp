/**
 * Hemp
 * Text Element
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

import Element from './Element.js';
import CanvasText from '../CanvasText/CanvasText.js';
import '../lib/fontfaceobserver.js';
import MediaCache from '../MediaCache.js';

function TextElement() {
  Element.call(this);
};

TextElement.prototype = Object.create(Element.prototype);
TextElement.prototype.constructor = TextElement;

/************************************************************************************/

TextElement.prototype.needsPreload = function(object) {
  if (object.customFont) {
    if (MediaCache.get(object.customFont.url)) {
      object.customFont.loaded = true;
      return false;
    } else {
      return true;
    }
  } else {
    return false;
  }
}

TextElement.prototype.preload = function(object, reflectorUrl) {
  return new Promise(function(resolve, reject) {

    // remove specific http protocol, allow automatic selection
    var url = object.customFont.url.replace('http:', '').replace('https:', '');

    // add @font-face for object.customFont.name and object.customFont.url
    var style = document.createElement('style');
    style.appendChild(document.createTextNode(
      "@font-face {font-family: '" + object.customFont.name + "'; src: url('" + url + "');}"
    ));
    document.head.appendChild(style);

    var font = new FontFaceObserver(object.customFont.name);

    font.load().then(function() {
      object.customFont.loaded = true;
      MediaCache.set(url, object.customFont);
      resolve();
    }.bind(this), function() {
      var error = 'Error loading custom font "' + object.customFont.name + '" from URL "' + url + '"';
      this._createPrivateProperty(object, '_error', error);
      reject(error);
    }.bind(this));

  }.bind(this));
};

TextElement.prototype.renderElement = function(environment, object) {
  if (environment.options && environment.options.selectionRender) {
    this._context.fillStyle = this.resolveColor(environment, object.color);
    this._context.fillRect(0, 0, object.width, object.height);
    return;
  }
  if (!object.customFont || (object.customFont && object.customFont.loaded)) {
    object._area = CanvasText.drawText(this._context, object);
  } else {
    this._renderPlaceholder(environment, object);
  }
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
          type: 'font',
        },
        {
          name: 'decoration',
          displayName: 'Decoration',
          type: 'spiffy',
          values: [
            {
              value: 'none',
              label: '',
              fontIcon: 'fa fa-font'
            },
            {
              value: 'underline',
              label: '',
              fontIcon: 'fa fa-underline'
            },
            {
              value: 'strikethrough',
              label: '',
              fontIcon: 'fa fa-strikethrough'
            }
          ],
          default: 'none'
        },
        {
          displayName: 'Color',
          type: 'group',
          properties: [
            {
              name: 'color',
              displayName: '',
              type: 'color',
              default: '#2677b0'
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
          displayName: 'Alignment',
          type: 'group',
          properties: [
            {
              name: 'align',
              displayName: '',
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
                },
/*
                {
                  value: 'fit',
                  label: '',
                  fontIcon: 'fa fa-align-justify'
                }
*/
              ],
              default: 'center'
            },
            {
              name: 'valign',
              displayName: '',
              type: 'spiffy',
              values: [
                {
                  value: 'top',
                  label: '',
                  fontIcon: 'fa fa-long-arrow-up'
                },
                {
                  value: 'middle',
                  label: '',
                  fontIcon: 'fa fa-arrows-v'
                },
                {
                  value: 'bottom',
                  label: '',
                  fontIcon: 'fa fa-long-arrow-down'
                }
              ],
              default: 'middle'
            },
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
              default: 0,
              width: 50
            },
            {
              name: 'backgroundRadius',
              displayName: 'rad',
              type: 'integer',
              default: 0,
              width: 35
            },
          ]
        },
        {
          name: 'padding',
          displayName: 'Padding',
          type: 'integer',
          default: 2
        },
        {
          displayName: 'Shadow',
          type: 'group',
          properties: [
            {
              name: 'shadowColor',
              displayName: '',
              type: 'color',
              default: '#000000'
            },
            {
              name: 'shadowOffset',
              displayName: 'dist',
              type: 'integer',
              default: '2',
              width: 30
            },
            {
              name: 'shadowBlur',
              displayName: 'blur',
              type: 'integer',
              default: '5',
              width: 30
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
