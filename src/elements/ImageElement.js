/**
 * Hemp
 * Image Element
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

import Element from './Element.js';
import MediaCache from '../MediaCache.js';

function ImageElement() {
  Element.call(this);
};

ImageElement.prototype = Object.create(Element.prototype);
ImageElement.prototype.constructor = ImageElement;

/************************************************************************************/

ImageElement.prototype.needsPreload = function(object) {
  var image = MediaCache.get(object.url);
  if (image) {
    this._createPrivateProperty(object, '_image', image);
    this._createPrivateProperty(object, '_imageLoaded', true);
    return false;
  } else {
    this._createPrivateProperty(object, '_imageLoaded', false);
    return true;
  }
}

ImageElement.prototype.preload = function(object, reflectorUrl) {
  return new Promise(function(resolve, reject) {
    var url = this._resolveMediaUrl(object.url, reflectorUrl);
    this._createPrivateProperty(object, '_image', new Image());
    object._image.crossOrigin = 'Anonymous';
    object._image.onload = function() {
      MediaCache.set(object.url, object._image);
      this._createPrivateProperty(object, '_imageLoaded', true);
      resolve();
    }.bind(this);
    object._image.onerror = function(event) {
      var error = 'Error loading image from URL ' + url;
      this._createPrivateProperty(object, '_error', error);
      reject(error);
    }.bind(this);
    object._image.src = url;
  }.bind(this));  
};

ImageElement.prototype._getFitHeightSource = function(src, dst, valign) {
  var width = src.width;
  var height = width * (dst.height / dst.width);
  if (height > src.height) {
    width = src.height * (dst.width / dst.height);
    height = src.height;
  }

  var offsetX = Math.max(0, src.width - width) / 2;

  var offsetY = Math.max(0, src.height - height) / 2;  
  switch (valign) {
    case 'top':
      offsetY = 0;
      break;
    case 'bottom':
      offsetY = src.height - height;
      break;
  }

  return {
    width: width,
    height: height,
    x: offsetX,
    y: offsetY
  };

};

ImageElement.prototype.renderElement = function(environment, object) {
  if (object._imageLoaded) {
    try {
      var source = this._getFitHeightSource(object._image, object, object.valign);
      this._context.drawImage(object._image, source.x, source.y, source.width, source.height, 0, 0, object.width, object.height);
    } catch (e) {
      this._renderPlaceholder(environment, object);
      console.log('exception when trying to render image', e);
    }
  } else {
    this._renderPlaceholder(environment, object);
  }
};

ImageElement.getTypes = function() {
  return {
    image: {
      displayName: 'Image',
      properties: [
        {
          name: 'url',
          displayName: 'URL',
          type: 'url',
          default: ''
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
          displayName: 'Alignment',
          type: 'group',
          properties: [
            {
              name: 'valign',
              displayName: '',
              type: 'spiffy',
              values: [
                {
                  value: 'top',
                  label: '',
                  fontIcon: 'fa fa-long-arrow-down'
                },
                {
                  value: 'middle',
                  label: '',
                  fontIcon: 'fa fa-arrows-v'
                },
                {
                  value: 'bottom',
                  label: '',
                  fontIcon: 'fa fa-long-arrow-up'
                }
              ],
              default: 'middle'
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
        },
        {
          name: 'compositing',
          displayName: 'Compositing',
          type: 'compositing',
          default: 'source-over'
        }
      ]
    }
  };
};

export default ImageElement;
