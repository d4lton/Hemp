/**
* Canvas Text
*
* Copyright ©2017 Dana Basken <dbasken@gmail.com>
*
*/

var CanvasText = {

  M_HEIGHT_FACTOR: 1.2,
  DEFAULT_LINE_HEIGHT: 1.5,
  DEFAULT_FONT_SIZE: 12,
  DEFAULT_FONT_FAMILY: 'Comic Sans MS',
  DEFAULT_FONT_COLOR: '#000000',
  FONT_HEIGHT_METHOD: 'canvas', // fontSize, measureM, dom, canvas

  fontHeightCache: {},
  fontOffsetCache: {},
  fontDescenderCache: {},

  /**
   * Draws word-wrapped text on a canvas, taking into account font size, top/right/bottom/left padding,
   * line height, horizontal and vertical alignment
   *
   * @param context {CanvasRenderingContext2D} The canvas context to render text into
   * @param object {Object} The text object
   *
   * Text Object has at least these properties:
   *
   *    var text = {
   *          text: 'Buy Our Stuff! $49.95!',
   *          align: 'right',    // right, left, center
   *          valign: 'bottom',  // top, bottom, middle
   *          paddingTop: 0,     // you can also just specify padding to set top/right/bottom/left
   *          paddingLeft: 150,
   *          paddingRight: 10,
   *          paddingBottom: 5,
   *          color: '#FF0000',
   *          fontSize: 20,
   *          fontFamily: 'Comic Sans MS',
   *        };
   *
   * The canvas context you pass to drawText should have a width and height assigned.
   */
  drawText: function drawText(context, object) {
    context.save();

    this._padding = CanvasText.resolvePadding(object);

    context.font = CanvasText.resolveFont(object);
    context.fillStyle = this.resolveColor(object.color, object.alpha);
    context.textAlign = object.align;
    context.textBaseline = 'top';

    var offset = CanvasText.resolveShadowOffset(object);
    context.shadowColor = object.shadowColor;
    context.shadowBlur = object.shadowBlur;
    context.shadowOffsetX = offset.x;
    context.shadowOffsetY = offset.y;

    var area = CanvasText.renderWordWrapRows(context, object, CanvasText.makeWordWrapRows(context, object));

    context.restore();

    return area;
  },

  renderWordWrapRows: function renderWordWrapRows(context, object, rows) {
    var lineHeight = typeof object.lineHeight !== 'undefined' ? object.lineHeight : CanvasText.DEFAULT_LINE_HEIGHT;
    var fontHeight = CanvasText.fontHeight(context, object);
    var rowHeight = fontHeight * lineHeight;

    var descenderHeight = CanvasText.fontDescenderCache[context.font] - CanvasText.fontHeightCache[context.font];

    var rowX = this._padding.left;
    if (object.align === 'right') {
      rowX = context.canvas.width - this._padding.right;
    }
    if (object.align === 'center') {
      rowX = context.canvas.width / 2;
    }

    var rowY = this._padding.top;
    if (object.valign === 'bottom') {
      rowY = context.canvas.height - rows.length * rowHeight - descenderHeight - this._padding.bottom;
    }
    if (object.valign === 'middle') {
      rowY = (context.canvas.height - rows.length * rowHeight) / 2;
    }

    var totalArea = 0;
    rows.forEach(function (row) {
      var width = CanvasText.calculateRowWidth(context, object, row);
      context.fillText(row, rowX, rowY - CanvasText.fontOffsetCache[context.font] + (rowHeight - fontHeight) / 2);
      CanvasText.renderDecoration(context, object, rowX, rowY, fontHeight, rowHeight, width);
      totalArea += fontHeight * width;
      rowY += rowHeight;
    });

    return totalArea;
  },

  renderDecoration: function renderDecoration(context, object, x, y, height, rowHeight, width) {
    if (object.decoration && object.decoration !== 'none') {

      context.save();

      context.shadowBlur = 0;
      context.shadowColor = 'rgba(0, 0, 0, 0)';
      context.strokeStyle = this.resolveColor(object.color, object.alpha);
      context.lineWidth = Math.max(1, height / 10);
      context.lineCap = 'round';

      var lineWidth = width - (this._padding.left + this._padding.right);

      var lineX = x;
      if (object.align === 'right') {
        lineX = x - lineWidth;
      }
      if (object.align === 'center') {
        lineX = x - lineWidth / 2;
      }

      var lineY = y + height;
      if (object.decoration === 'underline') {
        lineY += Math.min(20, height / 2);
      }
      if (object.decoration === 'strikethrough') {
        lineY = y + rowHeight / 2;
        lineY += Math.min(8, context.lineWidth * 2);
      }

      context.beginPath();
      context.moveTo(lineX, lineY);
      context.lineTo(lineX + lineWidth, lineY);
      context.stroke();

      context.restore();
    }
  },

  makeWordWrapRows: function makeWordWrapRows(context, object) {
    var words = object.text.split(/ /);
    var rowWords = [];
    var rows = [];
    words.forEach(function (word) {
      var rowWidth = CanvasText.calculateRowWidth(context, object, rowWords.concat(word).join(' '));
      if (rowWidth >= context.canvas.width && rowWords.length > 0) {
        rows.push(rowWords.join(' '));
        rowWords = [];
      }
      rowWords.push(word);
    });
    if (rowWords.length > 0) {
      rows.push(rowWords.join(' '));
    }
    return rows;
  },

  resolveFont: function resolveFont(object) {
    if (object.font) {
      return object.font;
    } else {
      var fontSize = object.fontSize ? object.fontSize : CanvasText.DEFAULT_FONT_SIZE;
      var fontFamily = object.fontFamily ? object.fontFamily : CanvasText.DEFAULT_FONT_FAMILY;
      return fontSize + "pt '" + fontFamily + "'";
    }
  },

  resolveColor: function resolveColor(color, alpha) {
    if (typeof alpha !== 'undefined') {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
      return 'rgba(' + parseInt(result[1], 16) + ', ' + parseInt(result[2], 16) + ', ' + parseInt(result[3], 16) + ', ' + alpha + ')';
    } else {
      return color;
    }
  },

  resolvePadding: function resolvePadding(object) {
    var padding = {};
    var defaultPadding = typeof object.padding !== 'undefined' ? object.padding : 0;
    padding.left = typeof object.paddingLeft !== 'undefined' ? object.paddingLeft : defaultPadding;
    padding.right = typeof object.paddingRight !== 'undefined' ? object.paddingRight : defaultPadding;
    padding.top = typeof object.paddingTop !== 'undefined' ? object.paddingTop : defaultPadding;
    padding.bottom = typeof object.paddingBottom !== 'undefined' ? object.paddingBottom : defaultPadding;
    return padding;
  },

  resolveShadowOffset: function resolveShadowOffset(object) {
    if (object.shadowOffset) {
      return {
        x: object.shadowOffset,
        y: object.shadowOffset
      };
    } else {
      return {
        x: object.shadowOffsetX,
        y: object.shadowOffsetY
      };
    }
  },

  calculateRowWidth: function calculateRowWidth(context, object, text) {
    return context.measureText(text).width + this._padding.left + this._padding.right;
  },

  fontHeight: function fontHeight(context, object) {
    // why oh why does context.measureText() not return height?
    if (!CanvasText.fontHeightCache[context.font]) {
      CanvasText.fontOffsetCache[context.font] = 0;
      switch (CanvasText.FONT_HEIGHT_METHOD) {
        case 'fontSize':
          var fontSize = parseInt(CanvasText.resolveFont(object));
          CanvasText.fontHeightCache[context.font] = fontSize * CanvasText.M_HEIGHT_FACTOR;
          break;
        case 'measureM':
          CanvasText.fontHeightCache[context.font] = context.measureText('M').width * CanvasText.M_HEIGHT_FACTOR;
          break;
        case 'dom':
          var div = document.createElement("div");
          div.innerHTML = object.text;
          div.style.position = 'absolute';
          div.style.top = '-9999px';
          div.style.left = '-9999px';
          div.style.font = context.font;
          document.body.appendChild(div);
          var size = { width: div.clientWidth, height: div.clientHeight };
          document.body.removeChild(div);
          CanvasText.fontHeightCache[context.font] = size.height;
          break;
        case 'canvas':
          CanvasText.fontHeightCache[context.font] = CanvasText.canvasFontHeight(context, object);
          break;
      }
    }
    return CanvasText.fontHeightCache[context.font];
  },

  canvasFontHeight: function canvasFontHeight(context, object) {
    CanvasText.fontDescenderCache[context.font] = this.canvasFontHeightForText(context, object, 'Mqypgj');
    return this.canvasFontHeightForText(context, object, 'M');
  },

  canvasFontHeightForText: function canvasFontHeightForText(context, object, text) {
    var offset = 10;
    var fontSize = parseInt(CanvasText.resolveFont(object));

    var canvas = document.createElement('canvas');
    canvas.height = fontSize * 5;
    canvas.width = context.measureText(text).width * 2;

    var fontContext = canvas.getContext('2d');
    fontContext.font = context.font;
    fontContext.textAlign = 'left';
    fontContext.textBaseline = 'top';
    fontContext.fillText(text, offset, offset);

    var data = fontContext.getImageData(0, 0, canvas.width, canvas.height).data;

    var first = canvas.height,
        last = 0;
    for (var y = 0; y < canvas.height; y++) {
      for (var x = 0; x < canvas.width; x++) {
        var alpha = data[(canvas.width * y + x) * 4 + 3];
        if (alpha > 0) {
          if (y < first) {
            first = y;
          }
          if (y > last) {
            last = y;
          }
        }
      }
    }

    CanvasText.fontOffsetCache[context.font] = first - offset;

    return last - first;
  }

};

/**
 * Hemp
 * Base Element
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */
function Element() {}

/************************************************************************************/

Element.prototype.render = function (environment, object) {
  var render = environment.options && environment.options.selectionRender === true ? 'select' : 'normal';
  if (object.visible !== false || render === 'select') {
    this.setupCanvas(environment, object);
    this.renderElement(environment, object);
    this.renderCanvas(environment, object);
  }
};

Element.prototype.setupCanvas = function (environment, object) {
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

Element.prototype.resolveRadius = function (radius) {
  if (typeof radius !== 'undefined') {
    return radius;
  } else {
    return 0;
  }
};

Element.prototype._fillRoundRect = function (context, x, y, w, h, r) {
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

Element.prototype.needsPreload = function (object) {
  return false;
};

Element.prototype.preload = function (object, reflectorUrl) {};

Element.prototype._resolveMediaUrl = function (url, reflectorUrl) {
  var result = url;
  if (reflectorUrl) {
    result = reflectorUrl.replace('{{url}}', encodeURIComponent(url));
  }
  return result;
};

Element.prototype.renderElement = function (environment, object) {
  console.warn('override me');
};

Element.prototype.renderCanvas = function (environment, object) {
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

Element.prototype._renderPlaceholder = function (environment, object) {

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
    textObject.font = fontSize + 'pt sans-serif', textObject.padding = fontSize;
    CanvasText.drawText(this._context, textObject);
  }
};

Element.prototype.resolveColor = function (environment, color, alpha) {
  var render = environment.options && environment.options.selectionRender === true ? 'select' : 'normal';
  if (render === 'select') {
    return 'black';
  } else {
    if (typeof alpha !== 'undefined') {
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(color);
      return 'rgba(' + parseInt(result[1], 16) + ', ' + parseInt(result[2], 16) + ', ' + parseInt(result[3], 16) + ', ' + alpha + ')';
    } else {
      return color;
    }
  }
};

Element.prototype._createPrivateProperty = function (object, property, value) {
  Object.defineProperty(object, property, { enumerable: false, configurable: true, writable: true, value: value });
};

Element.getTypes = function () {
  console.warn('override me');
};

var MediaCache = {

  _entries: {},

  _maxAgeMs: 300000,

  get: function get(key) {
    this._age();
    var entry = this._entries[key];
    if (entry) {
      entry.hitMs = Date.now();
      return entry.media;
    }
  },

  set: function set(key, media) {
    if (typeof key !== 'undefined') {
      this._entries[key] = {
        hitMs: Date.now(),
        media: media
      };
    }
    this._age();
  },

  _age: function _age() {
    var cutoffMs = Date.now() - this._maxAgeMs;
    Object.keys(this._entries).forEach(function (key) {
      if (this._entries[key].hitMs < cutoffMs) {
        delete this._entries[key];
      }
    }.bind(this));
  }

};

/**
 * Hemp
 * Image Element
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

function ImageElement() {
  Element.call(this);
}

ImageElement.prototype = Object.create(Element.prototype);
ImageElement.prototype.constructor = ImageElement;

/************************************************************************************/

ImageElement.prototype.needsPreload = function (object) {
  var image = MediaCache.get(object.url);
  if (image) {
    this._createPrivateProperty(object, '_image', image);
    this._createPrivateProperty(object, '_imageLoaded', true);
    return false;
  } else {
    this._createPrivateProperty(object, '_imageLoaded', false);
    return true;
  }
};

ImageElement.prototype.preload = function (object, reflectorUrl) {
  return new Promise(function (resolve, reject) {
    var url = this._resolveMediaUrl(object.url, reflectorUrl);
    this._createPrivateProperty(object, '_image', new Image());
    object._image.crossOrigin = 'Anonymous';
    object._image.onload = function () {
      MediaCache.set(object.url, object._image);
      this._createPrivateProperty(object, '_imageLoaded', true);
      resolve();
    }.bind(this);
    object._image.onerror = function (event) {
      this._createPrivateProperty(object, '_imageLoaded', false);
      var error = 'Error loading image from URL "' + url + '"';
      this._createPrivateProperty(object, '_error', error);
      reject(error);
    }.bind(this);
    object._image.src = url;
  }.bind(this));
};

ImageElement.prototype._getFitHeightSource = function (src, dst, valign) {
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

ImageElement.prototype.renderElement = function (environment, object) {
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

ImageElement.getTypes = function () {
  return {
    image: {
      displayName: 'Image',
      properties: [{
        name: 'url',
        displayName: 'URL',
        type: 'url',
        default: ''
      }, {
        displayName: 'Background',
        type: 'group',
        properties: [{
          name: 'backgroundColor',
          displayName: '',
          type: 'color',
          default: '#000000'
        }, {
          name: 'backgroundAlpha',
          displayName: '',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.01,
          default: 0,
          width: 50
        }, {
          name: 'backgroundRadius',
          displayName: 'rad',
          type: 'integer',
          default: 0,
          width: 35
        }]
      }, {
        displayName: 'Alignment',
        type: 'group',
        properties: [{
          name: 'valign',
          displayName: '',
          type: 'spiffy',
          values: [{
            value: 'top',
            label: '',
            fontIcon: 'fa fa-long-arrow-down'
          }, {
            value: 'middle',
            label: '',
            fontIcon: 'fa fa-arrows-v'
          }, {
            value: 'bottom',
            label: '',
            fontIcon: 'fa fa-long-arrow-up'
          }],
          default: 'middle'
        }]
      }, {
        name: 'position',
        displayName: 'Position',
        type: 'group',
        properties: [{
          type: 'integer',
          name: 'x',
          displayName: 'X',
          default: 120
        }, {
          type: 'integer',
          name: 'y',
          displayName: 'Y',
          default: 120
        }]
      }, {
        name: 'size',
        displayName: 'Size',
        type: 'group',
        properties: [{
          type: 'integer',
          name: 'width',
          displayName: 'W',
          default: 200
        }, {
          type: 'integer',
          name: 'height',
          displayName: 'H',
          default: 200
        }]
      }, {
        displayName: 'Rotation',
        type: 'group',
        properties: [{
          name: 'rotation',
          displayName: '',
          type: 'range',
          min: 0,
          max: 360,
          step: 1,
          default: 0,
          width: 60
        }, {
          name: 'rotation',
          displayName: '',
          type: 'integer',
          default: 0,
          width: 32
        }]
      }, {
        name: 'opacity',
        displayName: 'Opacity',
        type: 'range',
        min: 0,
        max: 1,
        step: 0.01,
        default: 1
      }, {
        name: 'compositing',
        displayName: 'Compositing',
        type: 'compositing',
        default: 'source-over'
      }]
    }
  };
};

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/* Font Face Observer v2.0.13 - © Bram Stein. License: BSD-3-Clause */(function () {
  'use strict';
  var f,
      g = [];function l(a) {
    g.push(a);1 == g.length && f();
  }function m() {
    for (; g.length;) {
      g[0](), g.shift();
    }
  }f = function f() {
    setTimeout(m);
  };function n(a) {
    this.a = p;this.b = void 0;this.f = [];var b = this;try {
      a(function (a) {
        q(b, a);
      }, function (a) {
        r(b, a);
      });
    } catch (c) {
      r(b, c);
    }
  }var p = 2;function t(a) {
    return new n(function (b, c) {
      c(a);
    });
  }function u(a) {
    return new n(function (b) {
      b(a);
    });
  }function q(a, b) {
    if (a.a == p) {
      if (b == a) throw new TypeError();var c = !1;try {
        var d = b && b.then;if (null != b && "object" == (typeof b === "undefined" ? "undefined" : _typeof(b)) && "function" == typeof d) {
          d.call(b, function (b) {
            c || q(a, b);c = !0;
          }, function (b) {
            c || r(a, b);c = !0;
          });return;
        }
      } catch (e) {
        c || r(a, e);return;
      }a.a = 0;a.b = b;v(a);
    }
  }
  function r(a, b) {
    if (a.a == p) {
      if (b == a) throw new TypeError();a.a = 1;a.b = b;v(a);
    }
  }function v(a) {
    l(function () {
      if (a.a != p) for (; a.f.length;) {
        var b = a.f.shift(),
            c = b[0],
            d = b[1],
            e = b[2],
            b = b[3];try {
          0 == a.a ? "function" == typeof c ? e(c.call(void 0, a.b)) : e(a.b) : 1 == a.a && ("function" == typeof d ? e(d.call(void 0, a.b)) : b(a.b));
        } catch (h) {
          b(h);
        }
      }
    });
  }n.prototype.g = function (a) {
    return this.c(void 0, a);
  };n.prototype.c = function (a, b) {
    var c = this;return new n(function (d, e) {
      c.f.push([a, b, d, e]);v(c);
    });
  };
  function w(a) {
    return new n(function (b, c) {
      function d(c) {
        return function (d) {
          h[c] = d;e += 1;e == a.length && b(h);
        };
      }var e = 0,
          h = [];0 == a.length && b(h);for (var k = 0; k < a.length; k += 1) {
        u(a[k]).c(d(k), c);
      }
    });
  }function x(a) {
    return new n(function (b, c) {
      for (var d = 0; d < a.length; d += 1) {
        u(a[d]).c(b, c);
      }
    });
  }window.Promise || (window.Promise = n, window.Promise.resolve = u, window.Promise.reject = t, window.Promise.race = x, window.Promise.all = w, window.Promise.prototype.then = n.prototype.c, window.Promise.prototype["catch"] = n.prototype.g);
})();

(function () {
  function l(a, b) {
    document.addEventListener ? a.addEventListener("scroll", b, !1) : a.attachEvent("scroll", b);
  }function m(a) {
    document.body ? a() : document.addEventListener ? document.addEventListener("DOMContentLoaded", function c() {
      document.removeEventListener("DOMContentLoaded", c);a();
    }) : document.attachEvent("onreadystatechange", function k() {
      if ("interactive" == document.readyState || "complete" == document.readyState) document.detachEvent("onreadystatechange", k), a();
    });
  }function r(a) {
    this.a = document.createElement("div");this.a.setAttribute("aria-hidden", "true");this.a.appendChild(document.createTextNode(a));this.b = document.createElement("span");this.c = document.createElement("span");this.h = document.createElement("span");this.f = document.createElement("span");this.g = -1;this.b.style.cssText = "max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";this.c.style.cssText = "max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";
    this.f.style.cssText = "max-width:none;display:inline-block;position:absolute;height:100%;width:100%;overflow:scroll;font-size:16px;";this.h.style.cssText = "display:inline-block;width:200%;height:200%;font-size:16px;max-width:none;";this.b.appendChild(this.h);this.c.appendChild(this.f);this.a.appendChild(this.b);this.a.appendChild(this.c);
  }
  function t(a, b) {
    a.a.style.cssText = "max-width:none;min-width:20px;min-height:20px;display:inline-block;overflow:hidden;position:absolute;width:auto;margin:0;padding:0;top:-999px;white-space:nowrap;font-synthesis:none;font:" + b + ";";
  }function y(a) {
    var b = a.a.offsetWidth,
        c = b + 100;a.f.style.width = c + "px";a.c.scrollLeft = c;a.b.scrollLeft = a.b.scrollWidth + 100;return a.g !== b ? (a.g = b, !0) : !1;
  }function z(a, b) {
    function c() {
      var a = k;y(a) && a.a.parentNode && b(a.g);
    }var k = a;l(a.b, c);l(a.c, c);y(a);
  }function A(a, b) {
    var c = b || {};this.family = a;this.style = c.style || "normal";this.weight = c.weight || "normal";this.stretch = c.stretch || "normal";
  }var B = null,
      C = null,
      E = null,
      F = null;function G() {
    if (null === C) if (J() && /Apple/.test(window.navigator.vendor)) {
      var a = /AppleWebKit\/([0-9]+)(?:\.([0-9]+))(?:\.([0-9]+))/.exec(window.navigator.userAgent);C = !!a && 603 > parseInt(a[1], 10);
    } else C = !1;return C;
  }function J() {
    null === F && (F = !!document.fonts);return F;
  }
  function K() {
    if (null === E) {
      var a = document.createElement("div");try {
        a.style.font = "condensed 100px sans-serif";
      } catch (b) {}E = "" !== a.style.font;
    }return E;
  }function L(a, b) {
    return [a.style, a.weight, K() ? a.stretch : "", "100px", b].join(" ");
  }
  A.prototype.load = function (a, b) {
    var c = this,
        k = a || "BESbswy",
        q = 0,
        D = b || 3E3,
        H = new Date().getTime();return new Promise(function (a, b) {
      if (J() && !G()) {
        var M = new Promise(function (a, b) {
          function e() {
            new Date().getTime() - H >= D ? b() : document.fonts.load(L(c, '"' + c.family + '"'), k).then(function (c) {
              1 <= c.length ? a() : setTimeout(e, 25);
            }, function () {
              b();
            });
          }e();
        }),
            N = new Promise(function (a, c) {
          q = setTimeout(c, D);
        });Promise.race([N, M]).then(function () {
          clearTimeout(q);a(c);
        }, function () {
          b(c);
        });
      } else m(function () {
        function u() {
          var b;if (b = -1 != f && -1 != g || -1 != f && -1 != h || -1 != g && -1 != h) (b = f != g && f != h && g != h) || (null === B && (b = /AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent), B = !!b && (536 > parseInt(b[1], 10) || 536 === parseInt(b[1], 10) && 11 >= parseInt(b[2], 10))), b = B && (f == v && g == v && h == v || f == w && g == w && h == w || f == x && g == x && h == x)), b = !b;b && (d.parentNode && d.parentNode.removeChild(d), clearTimeout(q), a(c));
        }function I() {
          if (new Date().getTime() - H >= D) d.parentNode && d.parentNode.removeChild(d), b(c);else {
            var a = document.hidden;if (!0 === a || void 0 === a) f = e.a.offsetWidth, g = n.a.offsetWidth, h = p.a.offsetWidth, u();q = setTimeout(I, 50);
          }
        }var e = new r(k),
            n = new r(k),
            p = new r(k),
            f = -1,
            g = -1,
            h = -1,
            v = -1,
            w = -1,
            x = -1,
            d = document.createElement("div");d.dir = "ltr";t(e, L(c, "sans-serif"));t(n, L(c, "serif"));t(p, L(c, "monospace"));d.appendChild(e.a);d.appendChild(n.a);d.appendChild(p.a);document.body.appendChild(d);v = e.a.offsetWidth;w = n.a.offsetWidth;x = p.a.offsetWidth;I();z(e, function (a) {
          f = a;u();
        });t(e, L(c, '"' + c.family + '",sans-serif'));z(n, function (a) {
          g = a;u();
        });t(n, L(c, '"' + c.family + '",serif'));
        z(p, function (a) {
          h = a;u();
        });t(p, L(c, '"' + c.family + '",monospace'));
      });
    });
  };"object" === (typeof module === "undefined" ? "undefined" : _typeof(module)) ? module.exports = A : (window.FontFaceObserver = A, window.FontFaceObserver.prototype.load = A.prototype.load);
})();

/**
 * Hemp
 * Text Element
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

function TextElement() {
  Element.call(this);
}

TextElement.prototype = Object.create(Element.prototype);
TextElement.prototype.constructor = TextElement;

/************************************************************************************/

TextElement.prototype.needsPreload = function (object) {
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
};

TextElement.prototype.preload = function (object, reflectorUrl) {
  return new Promise(function (resolve, reject) {

    var url = new URL(object.customFont.url);
    // upgrade to SSL, some CDNs don't allow non-secure access
    if (url.protocol === 'http:') {
      url.protocol = 'https:';
    }

    // add @font-face for object.customFont.name and object.customFont.url
    var style = document.createElement('style');
    style.appendChild(document.createTextNode("@font-face {font-family: '" + object.customFont.name + "'; src: url('" + url.href + "');}"));
    document.head.appendChild(style);

    var font = new FontFaceObserver(object.customFont.name);

    font.load().then(function () {
      object.customFont.loaded = true;
      MediaCache.set(url, object.customFont);
      resolve();
    }.bind(this), function () {
      var error = 'Error loading custom font "' + object.customFont.name + '" from URL "' + url.href + '"';
      this._createPrivateProperty(object, '_error', error);
      reject(error);
    }.bind(this));
  }.bind(this));
};

TextElement.prototype.renderElement = function (environment, object) {
  if (environment.options && environment.options.selectionRender) {
    this._context.fillStyle = this.resolveColor(environment, object.color);
    this._context.fillRect(0, 0, object.width, object.height);
    return;
  }
  if (!object.customFont || object.customFont && object.customFont.loaded) {
    object._area = CanvasText.drawText(this._context, object);
  } else {
    this._renderPlaceholder(environment, object);
  }
};

TextElement.getTypes = function () {
  return {
    text: {
      displayName: 'Text',
      properties: [{
        name: 'text',
        displayName: 'Text',
        type: 'string',
        default: 'Text'
      }, {
        name: 'font',
        displayName: 'Font',
        type: 'font'
      }, {
        name: 'decoration',
        displayName: 'Decoration',
        type: 'spiffy',
        values: [{
          value: 'none',
          label: '',
          fontIcon: 'fa fa-font'
        }, {
          value: 'underline',
          label: '',
          fontIcon: 'fa fa-underline'
        }, {
          value: 'strikethrough',
          label: '',
          fontIcon: 'fa fa-strikethrough'
        }],
        default: 'none'
      }, {
        displayName: 'Color',
        type: 'group',
        properties: [{
          name: 'color',
          displayName: '',
          type: 'color',
          default: '#2677b0'
        }, {
          name: 'alpha',
          displayName: '',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.01,
          default: 1,
          width: 50
        }]
      }, {
        displayName: 'Alignment',
        type: 'group',
        properties: [{
          name: 'align',
          displayName: '',
          type: 'spiffy',
          values: [{
            value: 'left',
            label: '',
            fontIcon: 'fa fa-align-left'
          }, {
            value: 'center',
            label: '',
            fontIcon: 'fa fa-align-center'
          }, {
            value: 'right',
            label: '',
            fontIcon: 'fa fa-align-right'
          }],
          default: 'center'
        }, {
          name: 'valign',
          displayName: '',
          type: 'spiffy',
          values: [{
            value: 'top',
            label: '',
            fontIcon: 'fa fa-long-arrow-up'
          }, {
            value: 'middle',
            label: '',
            fontIcon: 'fa fa-arrows-v'
          }, {
            value: 'bottom',
            label: '',
            fontIcon: 'fa fa-long-arrow-down'
          }],
          default: 'middle'
        }]
      }, {
        displayName: 'Background',
        type: 'group',
        properties: [{
          name: 'backgroundColor',
          displayName: '',
          type: 'color',
          default: '#000000'
        }, {
          name: 'backgroundAlpha',
          displayName: '',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.01,
          default: 0,
          width: 50
        }, {
          name: 'backgroundRadius',
          displayName: 'rad',
          type: 'integer',
          default: 0,
          width: 35
        }]
      }, {
        name: 'padding',
        displayName: 'Padding',
        type: 'integer',
        default: 2
      }, {
        displayName: 'Shadow',
        type: 'group',
        properties: [{
          name: 'shadowColor',
          displayName: '',
          type: 'color',
          default: '#000000'
        }, {
          name: 'shadowOffset',
          displayName: 'dist',
          type: 'integer',
          default: '2',
          width: 30
        }, {
          name: 'shadowBlur',
          displayName: 'blur',
          type: 'integer',
          default: '5',
          width: 30
        }]
      }, {
        name: 'position',
        displayName: 'Position',
        type: 'group',
        properties: [{
          type: 'integer',
          name: 'x',
          displayName: 'X',
          default: 120
        }, {
          type: 'integer',
          name: 'y',
          displayName: 'Y',
          default: 120
        }]
      }, {
        name: 'size',
        displayName: 'Size',
        type: 'group',
        properties: [{
          type: 'integer',
          name: 'width',
          displayName: 'W',
          default: 200
        }, {
          type: 'integer',
          name: 'height',
          displayName: 'H',
          default: 200
        }]
      }, {
        displayName: 'Rotation',
        type: 'group',
        properties: [{
          name: 'rotation',
          displayName: '',
          type: 'range',
          min: 0,
          max: 360,
          step: 1,
          default: 0,
          width: 60
        }, {
          name: 'rotation',
          displayName: '',
          type: 'integer',
          default: 0,
          width: 32
        }]
      }, {
        name: 'opacity',
        displayName: 'Opacity',
        type: 'range',
        min: 0,
        max: 1,
        step: 0.01,
        default: 1
      }]
    }
  };
};

/**
 * Hemp
 * Shape Element
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

function ShapeElement() {
  Element.call(this);
}

ShapeElement.prototype = Object.create(Element.prototype);
ShapeElement.prototype.constructor = ShapeElement;

/************************************************************************************/

ShapeElement.prototype.renderElement = function (environment, object) {
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

ShapeElement.prototype.renderRectangle = function (environment, object) {
  this._context.fillStyle = this.resolveColor(environment, object.color, object.alpha);
  this._fillRoundRect(this._context, 0, 0, object.width, object.height, this.resolveRadius(object.radius));
};

ShapeElement.prototype.renderEllipse = function (environment, object) {
  this._context.save();
  this._context.beginPath();
  this._context.scale(object.width / 2, object.height / 2);
  this._context.arc(1, 1, 1, 0, 2 * Math.PI, false);
  this._context.restore();

  this._context.fillStyle = this.resolveColor(environment, object.color, object.alpha);
  this._context.fill();
};

ShapeElement.getTypes = function () {
  return {
    rectangle: {
      displayName: 'Rectangle',
      properties: [{
        displayName: 'Color',
        type: 'group',
        properties: [{
          name: 'color',
          displayName: '',
          type: 'color',
          default: '#2677b0'
        }, {
          name: 'alpha',
          displayName: '',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.01,
          default: 1,
          width: 50
        }, {
          name: 'radius',
          displayName: 'rad',
          type: 'integer',
          default: 0,
          width: 35
        }]
      }, {
        name: 'position',
        displayName: 'Position',
        type: 'group',
        properties: [{
          type: 'integer',
          name: 'x',
          displayName: 'X',
          default: 120
        }, {
          type: 'integer',
          name: 'y',
          displayName: 'Y',
          default: 120
        }]
      }, {
        name: 'size',
        displayName: 'Size',
        type: 'group',
        properties: [{
          type: 'integer',
          name: 'width',
          displayName: 'W',
          default: 200
        }, {
          type: 'integer',
          name: 'height',
          displayName: 'H',
          default: 200
        }]
      }, {
        displayName: 'Rotation',
        type: 'group',
        properties: [{
          name: 'rotation',
          displayName: '',
          type: 'range',
          min: 0,
          max: 360,
          step: 1,
          default: 0,
          width: 60
        }, {
          name: 'rotation',
          displayName: '',
          type: 'integer',
          default: 0,
          width: 32
        }]
      }]
    },
    ellipse: {
      displayName: 'Ellipse',
      properties: [{
        displayName: 'Color',
        type: 'group',
        properties: [{
          name: 'color',
          displayName: '',
          type: 'color',
          default: '#2677b0'
        }, {
          name: 'alpha',
          displayName: '',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.01,
          default: 1,
          width: 50
        }]
      }, {
        displayName: 'Background',
        type: 'group',
        properties: [{
          name: 'backgroundColor',
          displayName: '',
          type: 'color',
          default: '#000000'
        }, {
          name: 'backgroundAlpha',
          displayName: '',
          type: 'range',
          min: 0,
          max: 1,
          step: 0.01,
          default: 0,
          width: 50
        }, {
          name: 'backgroundRadius',
          displayName: 'rad',
          type: 'integer',
          default: 0,
          width: 35
        }]
      }, {
        name: 'position',
        displayName: 'Position',
        type: 'group',
        properties: [{
          type: 'integer',
          name: 'x',
          displayName: 'X',
          default: 120
        }, {
          type: 'integer',
          name: 'y',
          displayName: 'Y',
          default: 120
        }]
      }, {
        name: 'size',
        displayName: 'Size',
        type: 'group',
        properties: [{
          type: 'integer',
          name: 'width',
          displayName: 'W',
          default: 200
        }, {
          type: 'integer',
          name: 'height',
          displayName: 'H',
          default: 200
        }]
      }, {
        displayName: 'Rotation',
        type: 'group',
        properties: [{
          name: 'rotation',
          displayName: '',
          type: 'range',
          min: 0,
          max: 360,
          step: 1,
          default: 0,
          width: 60
        }, {
          name: 'rotation',
          displayName: '',
          type: 'integer',
          default: 0,
          width: 32
        }]
      }, {
        name: 'opacity',
        displayName: 'Opacity',
        type: 'range',
        min: 0,
        max: 1,
        step: 0.01,
        default: 1
      }]
    }
  };
};

/**
 * Hemp
 * Transform Element
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

function TransformElement() {
  Element.call(this);
}

TransformElement.prototype = Object.create(Element.prototype);
TransformElement.prototype.constructor = TransformElement;

/************************************************************************************/

TransformElement.handleSize = 15;

TransformElement.prototype.render = function (environment, object) {
  this.renderCanvas(environment, object);
};

TransformElement.prototype.setupCanvas = function (environment, object) {
  // this special element uses the main context to draw
};

TransformElement.prototype.renderElement = function (environment, object) {
  // this special element uses the main context to draw
};

TransformElement.prototype.renderCanvas = function (environment, object) {
  environment.context.save();

  var handleSize = TransformElement.handleSize * environment.scaling.x;

  environment.context.translate(object.x, object.y);
  if (typeof object.rotation !== 'undefined') {
    environment.context.rotate(object.rotation * Math.PI / 180);
  }

  for (var i = 0; i < 2; i++) {
    var type;
    if (i == 0) {
      environment.context.lineWidth = 4 * environment.scaling.x;
      environment.context.setLineDash([]);
      environment.context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
      type = 'stroke';
    } else {
      environment.context.lineWidth = 2 * environment.scaling.x;
      environment.context.setLineDash([6, 2]);
      environment.context.strokeStyle = 'rgba(255, 255, 0, 0.5)';
      environment.context.fillStyle = 'rgba(255, 255, 0, 0.5)';
      type = 'fill';
    }

    // body
    environment.context.strokeRect(-object.width / 2, -object.height / 2, object.width, object.height);

    if (object.locked !== true) {
      // ul
      TransformElement.fillOrStrokeRect(environment.context, -object.width / 2, -object.height / 2, handleSize, handleSize, type);
      // ur
      TransformElement.fillOrStrokeRect(environment.context, object.width / 2 - handleSize, -object.height / 2, handleSize, handleSize, type);
      // lr
      TransformElement.fillOrStrokeRect(environment.context, object.width / 2 - handleSize, object.height / 2 - handleSize, handleSize, handleSize, type);
      // ll
      TransformElement.fillOrStrokeRect(environment.context, -object.width / 2, object.height / 2 - handleSize, handleSize, handleSize, type);

      // top
      TransformElement.fillOrStrokeRect(environment.context, -handleSize / 2, -object.height / 2, handleSize, handleSize, type);
      // right
      TransformElement.fillOrStrokeRect(environment.context, object.width / 2 - handleSize, -handleSize / 2, handleSize, handleSize, type);
      // bottom
      TransformElement.fillOrStrokeRect(environment.context, -handleSize / 2, object.height / 2 - handleSize, handleSize, handleSize, type);
      // left
      TransformElement.fillOrStrokeRect(environment.context, -object.width / 2, -handleSize / 2, handleSize, handleSize, type);

      // rotate handle
      TransformElement.fillOrStrokeRect(environment.context, -handleSize / 2, -(object.height / 2) - handleSize * 2, handleSize, handleSize, type);
      // rotate connector
      environment.context.strokeRect(0, -(object.height / 2) - handleSize, 1, handleSize);
    }
  }

  environment.context.restore();
};

TransformElement.fillOrStrokeRect = function (context, x, y, height, width, type) {
  switch (type) {
    case 'fill':
      context.fillRect(x, y, height, width);
      break;
    case 'stroke':
      context.strokeRect(x, y, height, width);
      break;
  }
};

TransformElement.findTransformHandle = function (environment, mouseX, mouseY, object) {
  var handles = ['ul', 'ur', 'll', 'lr', 'top', 'right', 'bottom', 'left', 'body', 'rotate'];
  var handleSize = TransformElement.handleSize * environment.scaling.x;
  for (var i = 0; i < handles.length; i++) {
    var handle = handles[i];

    environment.context.save();

    environment.context.translate(object.x, object.y);

    var radians = TransformElement.getObjectRotationInRadians(object);
    environment.context.rotate(radians);

    environment.context.beginPath();
    var handleX = object.width / 2;
    var handleY = object.height / 2;
    switch (handle) {
      case 'ul':
        // upper-left
        environment.context.rect(-handleX, -handleY, handleSize, handleSize);
        break;
      case 'ur':
        // upper-right
        environment.context.rect(handleX - handleSize, -handleY, handleSize, handleSize);
        break;
      case 'll':
        // upper-right
        environment.context.rect(-handleX, handleY - handleSize, handleSize, handleSize);
        break;
      case 'lr':
        // upper-right
        environment.context.rect(handleX - handleSize, handleY - handleSize, handleSize, handleSize);
        break;
      case 'top':
        environment.context.rect(-handleSize / 2, -handleY, handleSize, handleSize);
        break;
      case 'right':
        environment.context.rect(handleX - handleSize, -handleSize / 2, handleSize, handleSize);
        break;
      case 'bottom':
        environment.context.rect(-handleSize / 2, handleY - handleSize, handleSize, handleSize);
        break;
      case 'left':
        environment.context.rect(-handleX, -handleSize / 2, handleSize, handleSize);
        break;
      case 'rotate':
        environment.context.rect(-handleSize / 2, -handleY - handleSize * 2, handleSize, handleSize);
        break;
      case 'body':
        environment.context.rect(-object.width / 2, -object.height / 2, object.width, object.height);
        break;
    }
    var hit = environment.context.isPointInPath(mouseX, mouseY);
    environment.context.restore();
    if (hit) {
      return handle;
    }
  }
};

TransformElement.rotatePoint = function (radians, object, x, y) {
  return {
    x: object.x + Math.cos(radians) * (x - object.x) - Math.sin(radians) * (y - object.y),
    y: object.y + Math.sin(radians) * (x - object.x) + Math.cos(radians) * (y - object.y)
  };
};

TransformElement.getCorners = function (object) {
  var left = object.x - object.width / 2;
  var right = object.x + object.width / 2;
  var top = object.y - object.height / 2;
  var bottom = object.y + object.height / 2;
  var corners = {
    top: top,
    left: left,
    bottom: bottom,
    right: right,
    center: object.x,
    middle: object.y,
    ul: { x: left, y: top },
    ur: { x: right, y: top },
    ll: { x: left, y: bottom },
    lr: { x: right, y: bottom }
  };
  return corners;
};

TransformElement.updateObjectFromCorners = function (object, corners, fromCenter) {
  var handle = object._transform.handle;
  var anchor = object._transform.anchor;
  var top = corners.top,
      left = corners.left,
      bottom = corners.bottom,
      right = corners.right;

  // position the TRBL based on the handle and anchor
  switch (handle) {
    case 'ul':
      top = corners[handle].y;
      left = corners[handle].x;
      break;
    case 'lr':
      bottom = corners[handle].y;
      right = corners[handle].x;
      break;
    case 'ur':
      top = corners[handle].y;
      right = corners[handle].x;
      break;
    case 'll':
      left = corners[handle].x;
      bottom = corners[handle].y;
      break;
    case 'top':
      top = corners.top.y;
      break;
    case 'right':
      right = corners.right.x;
      break;
    case 'bottom':
      bottom = corners.bottom.y;
      break;
    case 'left':
      left = corners.left.x;
      break;
  }

  // calculate the object's new width and height
  object.width = right - left;
  object.height = bottom - top;

  // don't allow objects smaller than this (should be configurable)
  if (object.width < 50) {
    object.width = 50;
  }
  if (object.height < 50) {
    object.height = 50;
  }

  // if we're resizing with a fixed center, everything is easy
  if (fromCenter) {
    object.x = object._transform.origin.object.x;
    object.y = object._transform.origin.object.y;
  } else {
    // if we're resizing from an anchor corner, still have work to do

    // figure out the offsets for the object centerpoint based on the new W & H vs the old
    var offsetX = (object.width - object._transform.resize.origin.width) / 2;
    var offsetY = (object.height - object._transform.resize.origin.height) / 2;

    var radians = TransformElement.getObjectRotationInRadians(object);

    // for each handle type, we have to calculate the centerpoint slightly differently    
    switch (handle) {
      case 'ul':
        var offset = TransformElement.rotatePoint(radians, object, offsetX, offsetY);
        object.x = object._transform.resize.origin.x - offset.x;
        object.y = object._transform.resize.origin.y - offset.y;
        break;
      case 'ur':
      case 'top':
      case 'right':
        var offset = TransformElement.rotatePoint(-radians, object, offsetX, offsetY);
        object.x = object._transform.resize.origin.x + offset.x;
        object.y = object._transform.resize.origin.y - offset.y;
        break;
      case 'lr':
        var offset = TransformElement.rotatePoint(radians, object, offsetX, offsetY);
        object.x = object._transform.resize.origin.x + offset.x;
        object.y = object._transform.resize.origin.y + offset.y;
        break;
      case 'll':
      case 'bottom':
      case 'left':
        var offset = TransformElement.rotatePoint(-radians, object, offsetX, offsetY);
        object.x = object._transform.resize.origin.x - offset.x;
        object.y = object._transform.resize.origin.y + offset.y;
        break;
    }
  }
};

TransformElement.transformBegin = function (environment, object, handle, mouseX, mouseY, event) {
  var anchor;

  if (!object._clicks) {
    Object.defineProperty(object, '_clicks', { enumerable: false, configurable: true, writable: true, value: { count: 0 } });
  }

  clearTimeout(object._clicks.timeout);
  object._clicks.timeout = setTimeout(function () {
    object._clicks.count = 0;
  }, 200);

  switch (handle) {
    case 'ul':
      anchor = 'lr';
      break;
    case 'ur':
      anchor = 'll';
      break;
    case 'll':
      anchor = 'ur';
      break;
    case 'lr':
      anchor = 'ul';
      break;
    case 'top':
      anchor = 'bottom';
      break;
    case 'right':
      anchor = 'left';
      break;
    case 'bottom':
      anchor = 'top';
      break;
    case 'left':
      anchor = 'right';
      break;
    case 'body':
      object._clicks.count++;
      break;
  }

  Object.defineProperty(object, '_transform', { enumerable: false, configurable: true, writable: true });
  object._transform = {
    handle: handle,
    anchor: anchor,
    origin: {
      object: {
        x: object.x,
        y: object.y,
        height: object.height,
        width: object.width,
        corners: TransformElement.getCorners(object),
        rotation: object.rotation
      },
      mouse: {
        x: mouseX,
        y: mouseY
      }
    }
  };

  return object._clicks.count;
};

TransformElement.snapObject = function (environment, object) {
  var corners = TransformElement.getCorners(object);
  // TODO: this doesn't work for rotated objects very well
  var sides = [{ name: 'top', snap: 0, axis: 'y', derotate: true }, { name: 'right', snap: environment.canvas.width, axis: 'x', derotate: true }, { name: 'bottom', snap: environment.canvas.height, axis: 'y', derotate: true }, { name: 'left', snap: 0, axis: 'x', derotate: true }, { name: 'center', snap: environment.canvas.width / 2, axis: 'x', derotate: false }, { name: 'middle', snap: environment.canvas.height / 2, axis: 'y', derotate: false }];
  var snapped = false;
  var rotation = typeof object.rotation !== 'undefined' ? object.rotation : 0;
  var snappedRotation = Math.floor((rotation + 45) % 360 / 90) * 90;
  var axisSnapped = {};
  for (var i = 0; i < sides.length; i++) {
    var side = sides[i];
    if (axisSnapped[side.axis]) {
      // don't attempt to snap two things to an 'x' axis, for example
      continue;
    }
    var delta = side.snap - corners[side.name];
    if (Math.abs(delta) < 20) {
      axisSnapped[side.axis] = true;
      snapped = true;
      if (side.derotate) {
        object.rotation = 0; //snappedRotation;
      }
      object[side.axis] += delta;
    }
  }
  if (!snapped) {
    object.rotation = object._transform.origin.object.rotation;
  }
  return snapped;
};

TransformElement.snapMaximize = function (environment, object, mouseX, mouseY) {
  if (mouseY < 0) {
    if (!object._transform.maximizing) {
      object._transform.maximizing = true;
      object._transform.maximize = {};
      TransformElement.setObjectGeometry(object, object._transform.maximize);
      object.x = environment.canvas.width / 2;
      object.y = environment.canvas.height / 2;
      object.width = environment.canvas.width;
      object.height = environment.canvas.height;
      object.rotation = 0;
    }
  } else {
    if (object._transform.maximizing) {
      object._transform.maximizing = false;
      TransformElement.setObjectGeometry(object._transform.maximize, object);
      delete object._transform.maximize;
    }
  }
};

TransformElement.setObjectGeometry = function (src, dst, onlyLocation) {
  dst.x = src.x;
  dst.y = src.y;
  if (onlyLocation === true) {
    return;
  }
  dst.width = src.width;
  dst.height = src.height;
  dst.rotation = src.rotation;
};

TransformElement.snapToObject = function (object, hitObjects, event) {
  var hitObject;

  if (event.altKey) {
    if (hitObjects.length > 0) {
      for (var i = hitObjects.length - 1; i >= 0; i--) {
        if (hitObjects[i] !== object) {
          hitObject = hitObjects[i];
          break;
        }
      }
    }
  }

  if (hitObject) {
    // if we haven't saved the original size, do so
    if (!object._transform.snapped) {
      object._transform.snapped = {};
      TransformElement.setObjectGeometry(object, object._transform.snapped, true);
    }
    // set the height/width and x, y of object to hitObject
    TransformElement.setObjectGeometry(hitObject, object, true);
  } else {
    // if we saved the orignal size, restore
    if (object._transform.snapped) {
      TransformElement.setObjectGeometry(object._transform.snapped, object, true);
      delete object._transform.snapped;
    }
  }
};

TransformElement.transformMoveObject = function (environment, object, mouseX, mouseY, event, hitObjects) {
  var deltaX = mouseX - object._transform.origin.mouse.x;
  var deltaY = mouseY - object._transform.origin.mouse.y;

  if (!object._transform.maximizing) {
    object.x = object._transform.origin.object.x + deltaX;
    object.y = object._transform.origin.object.y + deltaY;
  }

  TransformElement.snapMaximize(environment, object, mouseX, mouseY);

  if (event.altKey) {
    if (TransformElement.snapObject(environment, object)) {
      return;
    }
  }

  // TODO: revisit this functionality
  //TransformElement.snapToObject(object, hitObjects, event);
};

TransformElement.getObjectRotationInRadians = function (object) {
  var rotation = 0;
  if (typeof object.rotation !== 'undefined') {
    rotation = object.rotation;
  }
  return rotation * (Math.PI / 180);
};

TransformElement.transformRotateObject = function (environment, object, mouseX, mouseY, event) {
  var radians = TransformElement.getObjectRotationInRadians(object);

  // offset mouse so it will be relative to 0,0 (the object's new origin)
  mouseX -= object.x;
  mouseY -= object.y;

  // move the object to 0, 0
  object.x = 0;
  object.y = 0;

  // rotate the mouse around 0, 0 so it matches the object's rotation
  var mouse = TransformElement.rotatePoint(-radians, object, mouseX, mouseY);

  var theta = Math.atan2(mouseY, mouseX) * (180 / Math.PI);
  if (theta < 0) theta = 360 + theta;
  theta = (theta + 90) % 360;
  if (event.altKey) {
    theta = Math.round(theta / 45) * 45;
  }
  object.rotation = theta;

  object.x = object._transform.origin.object.x;
  object.y = object._transform.origin.object.y;
};

TransformElement.transformResizeObject = function (environment, object, mouseX, mouseY, event) {
  var radians = TransformElement.getObjectRotationInRadians(object);

  // offset mouse so it will be relative to 0,0 (the object's new origin)
  mouseX -= object.x;
  mouseY -= object.y;

  // move the object to 0, 0

  object._transform.resize = {
    origin: {
      x: object.x,
      y: object.y,
      height: object.height,
      width: object.width
    }
  };

  object.x = 0;
  object.y = 0;

  // rotate the mouse around 0, 0 so it matches the object's rotation
  var mouse = TransformElement.rotatePoint(-radians, object, mouseX, mouseY);

  // find all the corners of the unrotated object
  var corners = TransformElement.getCorners(object);

  // move the handle to match the rotated mouse coordinates
  corners[object._transform.handle] = { x: mouse.x, y: mouse.y };

  // rebuild the object from the modified corners
  TransformElement.updateObjectFromCorners(object, corners, event.shiftKey);
};

TransformElement.transformMove = function (environment, object, mouseX, mouseY, event, hitObjects) {
  switch (object._transform.handle) {
    case 'body':
      TransformElement.transformMoveObject(environment, object, mouseX, mouseY, event, hitObjects);
      break;
    case 'rotate':
      TransformElement.transformRotateObject(environment, object, mouseX, mouseY, event);
      break;
    default:
      TransformElement.transformResizeObject(environment, object, mouseX, mouseY, event);
      break;
  }
};

TransformElement.transformEnd = function (environment, object, event) {
  object.x = Math.floor(object.x);
  object.y = Math.floor(object.y);
  object.height = Math.floor(object.height);
  object.width = Math.floor(object.width);
  object.rotation = Math.floor(object.rotation);
  delete object._transform;
};

/**
 * Hemp
 * Element Factory
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

var ElementFactory = {};

ElementFactory._elementTypeCache = {};

ElementFactory.getElement = function (object) {
  var element;
  if (!ElementFactory._elementTypeCache[object.type]) {
    switch (object.type) {
      case 'image':
        element = new ImageElement();
        break;
      case 'text':
        element = new TextElement();
        break;
      case 'rectangle':
      case 'ellipse':
        element = new ShapeElement();
        break;
      case 'transform':
        element = new TransformElement();
        break;
      default:
        throw new Error('Element ' + type + ' is not supported');
        break;
    }
    ElementFactory._elementTypeCache[object.type] = element;
  }
  return ElementFactory._elementTypeCache[object.type];
};

ElementFactory.getElements = function () {
  return [ImageElement, ShapeElement, TextElement];
};

/**
 * Hemp
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

// -----------------------------------------------------------------------------

var Hemp = function Hemp(width, height, objects, interactive, selector) {
  this._interactive = typeof interactive !== 'undefined' ? interactive : false;

  this._stickyTransform = false;
  this._allowWindowDeselect = false;

  if (typeof selector !== 'undefined') {
    this._element = this._findElement(selector);
  }

  if (this._interactive) {
    this._onMouseDownHandler = this._onMouseDown.bind(this);
    this._onKeyDownHandler = this._onKeyDown.bind(this);
    this._onKeyUpHandler = this._onKeyUp.bind(this);
    this._onMouseMoveHandler = this._onMouseMove.bind(this);
    this._onMouseUpHandler = this._onMouseUp.bind(this);
    window.addEventListener('keydown', this._onKeyDownHandler);
    window.addEventListener('keyup', this._onKeyUpHandler);
    window.addEventListener('mousemove', this._onMouseMoveHandler);
    window.addEventListener('mouseup', this._onMouseUpHandler);
    if (this._allowWindowDeselect) {
      this._onWindowMouseDownHandler = this._onWindowMouseDown.bind(this);
      window.addEventListener('mousedown', this._onWindowMouseDownHandler);
    }
  }

  this.setSize(width, height);
  this.setObjects(objects);
};
Hemp.prototype.constructor = Hemp;
Hemp.ElementFactory = ElementFactory;

// -----------------------------------------------------------------------------

Hemp.nextId = 0;

Hemp.prototype.getEnvironment = function () {
  return this._environment;
};

Hemp.prototype.setMediaReflectorUrl = function (url) {
  this._mediaReflectorUrl = url;
};

Hemp.prototype.setSize = function (width, height) {
  this._width = width;
  this._height = height;

  // remove the existing mousedown listener, if any
  if (this._environment) {
    if (this._element) {
      this._element.removeChild(this._environment.canvas);
    }
    if (this._interactive) {
      this._environment.canvas.removeEventListener('mousedown', this._onMouseDownHandler);
      this._environment.canvas.removeEventListener('contextmenu', this._onMouseDownHandler);
    }
  }

  // create a new base environment
  this._environment = this._setupRenderEnvironment({
    width: this._width,
    height: this._height
  });

  // if we have an element, attach to it
  if (this._element) {
    this._element.appendChild(this._environment.canvas);
    this._environment.scaling.x = this._width / this._element.clientWidth;
    this._environment.scaling.x = this._height / this._element.clientHeight;
  }

  // if we have user interaction, setup for canvas mousedowns
  if (this._interactive) {
    this._environment.canvas.setAttribute('tabIndex', '1');
    this._environment.canvas.addEventListener('mousedown', this._onMouseDownHandler);
    this._environment.canvas.addEventListener('contextmenu', this._onMouseDownHandler);
  }
};

Hemp.prototype.destroy = function () {
  if (this._interactive) {
    window.removeEventListener('keydown', this._onKeyDownHandler);
    window.removeEventListener('keyup', this._onKeyUpHandler);
    window.removeEventListener('mousemove', this._onMouseMoveHandler);
    window.removeEventListener('mouseup', this._onMouseUpHandler);
    this._environment.canvas.removeEventListener('mousedown', this._onMouseDownHandler);
    this._environment.canvas.removeEventListener('contextmenu', this._onMouseDownHandler);
    if (this._allowWindowDeselect) {
      window.removeEventListener('mousedown', this._onWindowMouseDownHandler);
    }
  }
};

Hemp.prototype.toImage = function (callback) {
  var image = new Image();
  image.onload = function () {
    callback(image);
  };
  image.src = this._environment.canvas.toDataURL("image/png");
};

Hemp.prototype.setObjects = function (objects, callback) {
  objects = objects && Array.isArray(objects) ? objects : [];

  this._addUpdateObjects(objects);

  var promises = [];
  var now = Date.now();
  this._objects.forEach(function (object, index) {
    this._generateInternalId(now, object);
    // setup the rendering element for this object type
    if (!object._element) {
      this._createPrivateProperty(object, '_element', ElementFactory.getElement(object));
    }
    // if this element needs to load media, add a promise for that here
    if (object._element.needsPreload(object)) {
      promises.push(object._element.preload(object, this._mediaReflectorUrl));
    }
  }.bind(this));

  // if there are any media-load promises, run them
  if (promises.length > 0) {
    var complete = 0,
        errors = [];
    promises.forEach(function (promise) {
      promise.then(function () {
        complete++;
        this._preloadComplete(complete >= promises.length, errors, callback);
      }.bind(this), function (error) {
        complete++;
        errors.push(error);
        this._preloadComplete(complete >= promises.length, errors, callback);
      }.bind(this));
    }.bind(this));
  } else {
    this._finishLoading(callback);
  }
};

Hemp.prototype._preloadComplete = function (allDone, errors, callback) {
  if (allDone) {
    this._finishLoading(callback, errors);
  } else {
    this.render();
  }
};

Hemp.prototype._generateInternalId = function (ms, object) {
  if (!object._internalId) {
    var id = ms + '_' + Hemp.nextId++;
    object._internalId = id;
  }
};

Hemp.prototype._getObjectByInternalId = function (id) {
  for (var i = 0; i < this._objects.length; i++) {
    if (this._objects[i]._internalId === id) {
      return this._objects[i];
    }
  }
};

Hemp.prototype._copyPublicProperties = function (src, dst) {
  Object.keys(src).forEach(function (id) {
    if (id.substr(0, 1) !== '_') {
      dst[id] = src[id];
    }
  });
};

Hemp.prototype._addUpdateObjects = function (objects) {
  if (!this._objects) {
    this._objects = [];
  }

  var selectedObjectIds = this._getObjects({ name: '_selected', value: true, op: 'eq' }).map(function (object) {
    return object._internalId;
  });

  this._objects = objects.concat(this._objects);

  for (var i = 0; i < this._objects.length; i++) {
    var found = false;
    for (var j = i + 1; j < this._objects.length; j++) {
      if (this._objects[i]._internalId && this._objects[i]._internalId === this._objects[j]._internalId) {
        // copy public properties from new "object" to old "object" (leaving private ones alone)
        this._copyPublicProperties(this._objects[i], this._objects[j]);
        // set the new "object" to the old "object" (now that public properties are the same)
        this._objects[j] = this._objects[i];
        // remove old "object" from the list
        this._objects.splice(j, 1);
        found = true;
        break;
      }
    }
    if (!found && i >= objects.length) {
      this._objects.splice(i, 1);
    }
  }

  this._objects.forEach(function (object) {
    if (selectedObjectIds.indexOf(object._internalId) !== -1) {
      this._createPrivateProperty(object, '_selected', true);
    }
  }.bind(this));
};

Hemp.prototype._finishLoading = function (callback, errors) {
  this.render();
  if (typeof callback === 'function') {
    callback(this._objects, errors);
  }
};

Hemp.prototype.getObjects = function () {
  return this._cleanObjects(this._objects).map(function (object) {
    return object;
  });
};

Hemp.prototype.getElement = function () {
  return this._element;
};

Hemp.prototype.render = function () {
  if (this._environment) {
    this._renderObjects(this._environment);
  }
};

Hemp.prototype.setStickyTransform = function (value) {
  if (typeof value !== 'undefined') {
    this._stickyTransform = value;
  }
};

Hemp.prototype.select = function (object) {
  if (object) {
    var selectedObject = this._getObjectByInternalId(object._internalId);
    if (selectedObject && !selectedObject._selected) {
      this._selectObject(selectedObject, true);
    }
  }
};

Hemp.prototype.deselect = function (object) {
  this._deselectAllObjects(true);
  this._renderObjects(this._environment);
};

Hemp.prototype._createCanvas = function (width, height) {
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

Hemp.prototype._setupContext = function (canvas) {
  return canvas.getContext('2d');
};

Hemp.prototype._findElement = function (selector) {
  if (typeof selector === 'string') {
    if (selector.indexOf('#') === 0) {
      selector = selector.slice(1);
      return document.getElementById(selector);
    }
    if (selector.indexOf('.') === 0) {
      selector = selector.slice(1);
      var elements = document.getElementsByClassName(selector);
      if (elements.length === 1) {
        return elements[0];
      } else {
        throw new Error('Ambiguous selector: ' + selector);
      }
    }
  }
  if (selector instanceof jQuery) {
    return selector.get(0);
  }
  throw new Error('Could not find selector: ' + selector);
};

Hemp.prototype._onKeyDown = function (event) {
  switch (event.code) {
    case 'Escape':
      this._deselectAllObjects();
      this._renderObjects(this._environment);
      break;
    case 'MetaLeft':
    case 'MetaRight':
      if (this._mouse) {
        event.clientX = this._mouse.x;
        event.clientY = this._mouse.y;
        this._onMouseMove(event);
      }
      break;
  }
};

Hemp.prototype._onKeyUp = function (event) {
  switch (event.code) {
    case 'MetaLeft':
    case 'MetaRight':
      if (this._mouse) {
        event.clientX = this._mouse.x;
        event.clientY = this._mouse.y;
        this._onMouseMove(event);
      }
      break;
    default:
      break;
  }
};

Hemp.prototype._nudgeObject = function (object, offsetX, offsetY, event) {
  if (object.locked !== true) {
    object.x = Math.floor(object.x + offsetX);
    object.y = Math.floor(object.y + offsetY);
    if (object.x < 0) {
      object.x = 0;
    }
    if (object.x > this._environment.canvas.width) {
      object.x = this._environment.canvas.width;
    }
    if (object.y < 0) {
      object.y = 0;
    }
    if (object.y > this._environment.canvas.height) {
      object.y = this._environment.canvas.height;
    }
    this._renderObjects(this._environment);
    this._reportObjectTransform(object);
  }
};

Hemp.prototype._onMouseDown = function (event) {
  event.preventDefault();
  var coordinates = Hemp.windowToCanvas(this._environment, event);
  var hitObjects = this._findObjectsAt(coordinates.x, coordinates.y);

  this._transformStart = Date.now();
  this._transformFrames = 0;

  // if there's already a selected object, transform it if possible
  if (this._setupTransformingObject(coordinates.x, coordinates.y, event, hitObjects)) {
    return false;
  }

  // if we hit an object, select it and start transforming it if possible
  if (hitObjects.length > 0) {
    var hitObject = hitObjects[hitObjects.length - 1];
    if (hitObject._selected !== true) {
      this._selectObject(hitObject);
    }
    this._setupTransformingObject(coordinates.x, coordinates.y, event);
  }
  return false;
};

Hemp.prototype._onWindowMouseDown = function (event) {
  var coordinates = Hemp.windowToCanvas(this._environment, event);
  if (coordinates.x < 0 || coordinates.y < 0 || coordinates.x > this._environment.canvas.width || coordinates.y > this._environment.canvas.height) {
    this._deselectAllObjects();
  }
};

Hemp.prototype._maximizeObject = function (object) {
  object.x = this._environment.canvas.width / 2;
  object.y = this._environment.canvas.height / 2;
  object.width = this._environment.canvas.width;
  object.height = this._environment.canvas.height;
  object.rotation = 0;
  this._renderObjects(this._environment);
};

Hemp.prototype._setupTransformingObject = function (mouseX, mouseY, event, hitObjects) {
  var selectedObjects = this._getObjects({ name: '_selected', value: true, op: 'eq' });
  if (selectedObjects.length > 0) {
    var handle = TransformElement.findTransformHandle(this._environment, mouseX, mouseY, selectedObjects[0]);
    if (handle) {
      // if we don't want sticky transforms, then if the body handle was clicked, return false if there are other objects
      if (handle === 'body' && !this._stickyTransform && Array.isArray(hitObjects) && hitObjects.length > 1) {
        return false;
      }
      this._transformingObject = selectedObjects[0];
      if (this._transformingObject.locked !== true) {
        var clicks = TransformElement.transformBegin(this._environment, this._transformingObject, handle, mouseX, mouseY, event);
      }
      return true;
    }
  }
  return false;
};

Hemp.prototype._reportObjectTransform = function (object) {
  if (this._element) {
    this._element.dispatchEvent(new CustomEvent('transform', { detail: this._cleanObject(object) }));
  }
};

Hemp.prototype._onMouseMove = function (event) {
  // hold on to the mouse position for other nefarious purposes
  this._mouse = {
    x: event.clientX,
    y: event.clientY
  };
  this._transformFrames++;
  // if we're in the middle of a transform, update the selected object and render the canvas
  if (this._transformingObject && this._transformingObject.locked !== true) {
    var coordinates = Hemp.windowToCanvas(this._environment, event);
    var hitObjects;
    if (event.altKey) {
      hitObjects = this._findObjectsAt(coordinates.x, coordinates.y);
    }
    TransformElement.transformMove(this._environment, this._transformingObject, coordinates.x, coordinates.y, event, hitObjects);
    this._renderObjects(this._environment);
    this._reportObjectTransform(this._transformingObject);
  }
};

Hemp.prototype._onMouseUp = function (event) {
  if (this._transformingObject && this._transformingObject.locked !== true) {
    TransformElement.transformEnd(this._environment, this._transformingObject, event);
    this._fps = this._transformFrames / (Date.now() - this._transformStart) * 1000;
    this._reportObjectTransform(this._transformingObject);
    this._transformingObject = null;
  }
  if (this._mouse) {
    delete this._mouse;
  }
  this._clearFindObjectsAt();
};

Hemp.prototype._deselectAllObjects = function (skipEvent) {
  var deselectedObjects = [];
  this._getObjects().forEach(function (object) {
    if (object._selected) {
      deselectedObjects.push(object);
    }
    delete object._selected;
  });
  if (deselectedObjects.length > 0) {
    if (this._element && skipEvent !== true) {
      this._element.dispatchEvent(new CustomEvent('deselect', { detail: this._cleanObjects(deselectedObjects) }));
    }
  }
};

Hemp.prototype._selectObject = function (object, skipEvent) {
  var selected = object._selected;
  this._deselectAllObjects(skipEvent);
  this._createPrivateProperty(object, '_selected', true);
  if (!selected) {
    this._renderObjects(this._environment);
  }
  if (this._element && skipEvent !== true) {
    this._element.dispatchEvent(new CustomEvent('select', { detail: this._cleanObject(object) }));
  }
};

Hemp.prototype._getObjects = function (filter) {
  if (Array.isArray(this._objects)) {
    if (filter) {
      return this._objects.filter(function (object) {
        switch (filter.op) {
          case 'eq':
            return object[filter.name] == filter.value;
            break;
          default:
            throw new Error('Unknown filter op: ' + filter.op);
            break;
        }
      }.bind(this));
    } else {
      return this._objects;
    }
  } else {
    return [];
  }
};

Hemp.prototype._clearFindObjectsAt = function () {
  this._getObjects().forEach(function (object) {
    if (object._hitEnvironment) {
      delete object._hitEnvironment;
    }
  }.bind(this));
};

Hemp.prototype._findObjectsAt = function (x, y) {
  var results = [];
  this._getObjects().forEach(function (object) {

    if (!object._hitEnvironment) {
      this._createPrivateProperty(object, '_hitEnvironment', this._setupRenderEnvironment({
        width: this._width,
        height: this._height
      }, {
        selectionRender: true
      }));
      this._renderObject(object._hitEnvironment, object);
    }
    var hitboxSize = 10; // make this configurable
    var p = object._hitEnvironment.context.getImageData(x - hitboxSize / 2, y - hitboxSize / 2, hitboxSize, hitboxSize).data;
    for (var i = 0; i < p.length; i += 4) {
      if (p[i + 3] !== 0) {
        // looking only at alpha channel
        results.push(object);
        break;
      }
    }
  }.bind(this));
  return results;
};

Hemp.prototype._renderObjects = function (environment) {
  var selectedObject;
  this._clearEnvironment(environment);
  this._getObjects().forEach(function (object) {
    if (this._interactive && object._selected) {
      selectedObject = object;
    }
    this._renderObject(environment, object);
  }.bind(this));
  if (selectedObject) {
    this._renderTransformBoxForObject(environment, selectedObject);
  }
};

Hemp.prototype._cleanObjects = function (objects) {
  return objects.map(function (object) {
    return this._cleanObject(object);
  }.bind(this));
};

Hemp.prototype._cleanObject = function (object) {
  return JSON.parse(JSON.stringify(object));
};

Hemp.prototype._renderTransformBoxForObject = function (environment, object) {
  var transformObject = this._cleanObject(object);
  transformObject.type = 'transform';
  this._createPrivateProperty(transformObject, '_element', ElementFactory.getElement(transformObject));
  this._renderObject(environment, transformObject);
};

Hemp.prototype._createPrivateProperty = function (object, property, value) {
  Object.defineProperty(object, property, { enumerable: false, configurable: true, writable: true, value: value });
};

Hemp.prototype._renderObject = function (environment, object) {
  object._element.render(environment, object, {});
};

Hemp.prototype._setupRenderEnvironment = function (object, options) {
  var canvas = this._createCanvas(object.width, object.height);
  var context = this._setupContext(canvas);
  return {
    options: options ? options : {},
    canvas: canvas,
    context: context,
    scaling: {
      x: 1,
      y: 1
    }
  };
};

Hemp.prototype._clearEnvironment = function (environment) {
  environment.context.save();
  environment.context.fillStyle = '#000000';
  environment.context.fillRect(0, 0, environment.canvas.width, environment.canvas.height);
  environment.context.restore();
};

// -----------------------------------------------------------------------------

Hemp.windowToCanvas = function (environment, event) {
  var x = event.clientX;
  var y = event.clientY;
  var rect = { left: 0, top: 0, width: 1, height: 1 };
  if (environment) {
    rect = environment.canvas.getBoundingClientRect();
  }
  return {
    x: (x - rect.left) * (environment.canvas.width / rect.width),
    y: (y - rect.top) * (environment.canvas.height / rect.height)
  };
};

export default Hemp;
