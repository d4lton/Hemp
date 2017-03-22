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
  if (object.visible !== false || environment.options && environment.options.selectionRender) {
    clearTimeout(this._renderTimeout);
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
  if (typeof object.opacity !== 'undefined' && object.opacity != 1) {
    environment.context.globalAlpha = object.opacity;
  }
  if (typeof object.compositing !== 'undefined') {
    environment.context.globalCompositeOperation = object.compositing;
  }
  environment.context.drawImage(this._canvas, -object.width / 2, -object.height / 2);
  environment.context.restore();
};

Element.prototype._renderPlaceholder = function (environment, object) {
  this._context.strokeStyle = '#FFFF80';
  this._context.lineWidth = 10;
  this._context.setLineDash([8, 4]);
  this._context.strokeRect(0, 0, object.width, object.height);
};

Element.prototype.resolveColor = function (environment, color, alpha) {
  if (environment.options && environment.options.selectionRender) {
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
    this._entries[key] = {
      hitMs: Date.now(),
      media: media
    };
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
    this._createPrivateProperty(object, '_image', new Image());
    object._image.crossOrigin = 'Anonymous';
    object._image.onload = function () {
      MediaCache.set(this.url, object._image);
      this._createPrivateProperty(object, '_imageLoaded', true);
      resolve();
    }.bind(this);
    object._image.onerror = function (event) {
      console.log('could not load image from ', object.url, reflectorUrl, this._resolveMediaUrl(object.url, reflectorUrl));
      this._createPrivateProperty(object, '_imageLoaded', false);
      reject();
    }.bind(this);
    object._image.src = this._resolveMediaUrl(object.url, reflectorUrl);
  }.bind(this));
};

ImageElement.prototype._getFitHeightSource = function (src, dst) {
  var width = src.width;
  var height = width * (dst.height / dst.width);
  if (height > src.height) {
    width = src.height * (dst.width / dst.height);
    height = src.height;
  }
  var offsetX = Math.max(0, src.width - width) / 2;
  var offsetY = Math.max(0, src.height - height) / 2;
  return {
    width: width,
    height: height,
    x: offsetX,
    y: offsetY
  };
};

ImageElement.prototype._getFitWidthSource = function (src, dst) {
  var width = src.width;
  var height = width * (dst.height / dst.width);
  if (height > src.height) {
    width = src.height * (dst.width / dst.height);
    height = src.height;
  }
  var offsetX = Math.max(0, src.width - width) / 2;
  var offsetY = Math.max(0, src.height - height) / 2;
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
      var source = this._getFitHeightSource(object._image, object);
      this._context.drawImage(object._image, source.x, source.y, source.width, source.height, 0, 0, object.width, object.height);
    } catch (e) {
      this._renderPlaceholder(environment, object);
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
          default: 1,
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
      }, {
        name: 'compositing',
        displayName: 'Compositing',
        type: 'string',
        default: ''
      }, {
        name: 'script',
        displayName: 'Script',
        type: 'script',
        default: 'source-over'
      }]
    }
  };
};

/**
* Canvas Text
*
* Copyright ©2017 Dana Basken <dbasken@gmail.com>
*
*/

var CanvasText = {

  M_HEIGHT_FACTOR: 1.2,
  DEFAULT_LINE_HEIGHT: 1.1,
  DEFAULT_FONT_SIZE: 12,
  DEFAULT_FONT_FAMILY: 'Comic Sans MS',
  DEFAULT_FONT_COLOR: '#000000',
  FONT_HEIGHT_METHOD: 'canvas', // fontSize, measureM, dom, canvas

  fontHeightCache: {},
  fontOffsetCache: {},

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
    context.textBaseline = 'top';
    context.fillStyle = this.resolveColor(object.color, object.alpha);
    context.textAlign = object.align;

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
    var rowHeight = CanvasText.fontHeight(context, object) * lineHeight;

    var rowX = this._padding.left;
    if (object.align === 'right') {
      rowX = context.canvas.width - this._padding.right;
    }
    if (object.align === 'center') {
      rowX = context.canvas.width / 2;
    }

    var rowY = this._padding.top;
    if (object.valign === 'bottom') {
      rowY = context.canvas.height - rows.length * rowHeight - this._padding.bottom;
    }
    if (object.valign === 'middle') {
      rowY = (context.canvas.height - rows.length * rowHeight) / 2;
    }

    var totalArea = 0;
    rows.forEach(function (row) {
      context.fillText(row, rowX, rowY - CanvasText.fontOffsetCache[context.font]);
      rowY += rowHeight;
      totalArea += rowHeight * CanvasText.calculateRowWidth(context, object, row);
    });

    return totalArea;
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
    var testString = 'M';
    var offset = 10;
    var fontSize = parseInt(CanvasText.resolveFont(object));

    var canvas = document.createElement('canvas');
    canvas.height = fontSize * 5;
    canvas.width = context.measureText(testString).width * 2;

    var fontContext = canvas.getContext('2d');
    fontContext.font = context.font;
    fontContext.textAlign = 'left';
    fontContext.textBaseline = 'top';
    fontContext.fillText(testString, offset, offset);

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

/* Web Font Loader v1.6.27 - (c) Adobe Systems, Google. License: Apache 2.0 */(function () {
  function aa(a, b, c) {
    return a.call.apply(a.bind, arguments);
  }function ba(a, b, c) {
    if (!a) throw Error();if (2 < arguments.length) {
      var d = Array.prototype.slice.call(arguments, 2);return function () {
        var c = Array.prototype.slice.call(arguments);Array.prototype.unshift.apply(c, d);return a.apply(b, c);
      };
    }return function () {
      return a.apply(b, arguments);
    };
  }function p(a, b, c) {
    p = Function.prototype.bind && -1 != Function.prototype.bind.toString().indexOf("native code") ? aa : ba;return p.apply(null, arguments);
  }var q = Date.now || function () {
    return +new Date();
  };function ca(a, b) {
    this.a = a;this.m = b || a;this.c = this.m.document;
  }var da = !!window.FontFace;function t(a, b, c, d) {
    b = a.c.createElement(b);if (c) for (var e in c) {
      c.hasOwnProperty(e) && ("style" == e ? b.style.cssText = c[e] : b.setAttribute(e, c[e]));
    }d && b.appendChild(a.c.createTextNode(d));return b;
  }function u(a, b, c) {
    a = a.c.getElementsByTagName(b)[0];a || (a = document.documentElement);a.insertBefore(c, a.lastChild);
  }function v(a) {
    a.parentNode && a.parentNode.removeChild(a);
  }
  function w(a, b, c) {
    b = b || [];c = c || [];for (var d = a.className.split(/\s+/), e = 0; e < b.length; e += 1) {
      for (var f = !1, g = 0; g < d.length; g += 1) {
        if (b[e] === d[g]) {
          f = !0;break;
        }
      }f || d.push(b[e]);
    }b = [];for (e = 0; e < d.length; e += 1) {
      f = !1;for (g = 0; g < c.length; g += 1) {
        if (d[e] === c[g]) {
          f = !0;break;
        }
      }f || b.push(d[e]);
    }a.className = b.join(" ").replace(/\s+/g, " ").replace(/^\s+|\s+$/, "");
  }function y(a, b) {
    for (var c = a.className.split(/\s+/), d = 0, e = c.length; d < e; d++) {
      if (c[d] == b) return !0;
    }return !1;
  }
  function z(a) {
    if ("string" === typeof a.f) return a.f;var b = a.m.location.protocol;"about:" == b && (b = a.a.location.protocol);return "https:" == b ? "https:" : "http:";
  }function ea(a) {
    return a.m.location.hostname || a.a.location.hostname;
  }
  function A(a, b, c) {
    function d() {
      k && e && f && (k(g), k = null);
    }b = t(a, "link", { rel: "stylesheet", href: b, media: "all" });var e = !1,
        f = !0,
        g = null,
        k = c || null;da ? (b.onload = function () {
      e = !0;d();
    }, b.onerror = function () {
      e = !0;g = Error("Stylesheet failed to load");d();
    }) : setTimeout(function () {
      e = !0;d();
    }, 0);u(a, "head", b);
  }
  function B(a, b, c, d) {
    var e = a.c.getElementsByTagName("head")[0];if (e) {
      var f = t(a, "script", { src: b }),
          g = !1;f.onload = f.onreadystatechange = function () {
        g || this.readyState && "loaded" != this.readyState && "complete" != this.readyState || (g = !0, c && c(null), f.onload = f.onreadystatechange = null, "HEAD" == f.parentNode.tagName && e.removeChild(f));
      };e.appendChild(f);setTimeout(function () {
        g || (g = !0, c && c(Error("Script load timeout")));
      }, d || 5E3);return f;
    }return null;
  }function C() {
    this.a = 0;this.c = null;
  }function D(a) {
    a.a++;return function () {
      a.a--;E(a);
    };
  }function F(a, b) {
    a.c = b;E(a);
  }function E(a) {
    0 == a.a && a.c && (a.c(), a.c = null);
  }function G(a) {
    this.a = a || "-";
  }G.prototype.c = function (a) {
    for (var b = [], c = 0; c < arguments.length; c++) {
      b.push(arguments[c].replace(/[\W_]+/g, "").toLowerCase());
    }return b.join(this.a);
  };function H(a, b) {
    this.c = a;this.f = 4;this.a = "n";var c = (b || "n4").match(/^([nio])([1-9])$/i);c && (this.a = c[1], this.f = parseInt(c[2], 10));
  }function fa(a) {
    return I(a) + " " + (a.f + "00") + " 300px " + J(a.c);
  }function J(a) {
    var b = [];a = a.split(/,\s*/);for (var c = 0; c < a.length; c++) {
      var d = a[c].replace(/['"]/g, "");-1 != d.indexOf(" ") || /^\d/.test(d) ? b.push("'" + d + "'") : b.push(d);
    }return b.join(",");
  }function K(a) {
    return a.a + a.f;
  }function I(a) {
    var b = "normal";"o" === a.a ? b = "oblique" : "i" === a.a && (b = "italic");return b;
  }
  function ga(a) {
    var b = 4,
        c = "n",
        d = null;a && ((d = a.match(/(normal|oblique|italic)/i)) && d[1] && (c = d[1].substr(0, 1).toLowerCase()), (d = a.match(/([1-9]00|normal|bold)/i)) && d[1] && (/bold/i.test(d[1]) ? b = 7 : /[1-9]00/.test(d[1]) && (b = parseInt(d[1].substr(0, 1), 10))));return c + b;
  }function ha(a, b) {
    this.c = a;this.f = a.m.document.documentElement;this.h = b;this.a = new G("-");this.j = !1 !== b.events;this.g = !1 !== b.classes;
  }function ia(a) {
    a.g && w(a.f, [a.a.c("wf", "loading")]);L(a, "loading");
  }function M(a) {
    if (a.g) {
      var b = y(a.f, a.a.c("wf", "active")),
          c = [],
          d = [a.a.c("wf", "loading")];b || c.push(a.a.c("wf", "inactive"));w(a.f, c, d);
    }L(a, "inactive");
  }function L(a, b, c) {
    if (a.j && a.h[b]) if (c) a.h[b](c.c, K(c));else a.h[b]();
  }function ja() {
    this.c = {};
  }function ka(a, b, c) {
    var d = [],
        e;for (e in b) {
      if (b.hasOwnProperty(e)) {
        var f = a.c[e];f && d.push(f(b[e], c));
      }
    }return d;
  }function N(a, b) {
    this.c = a;this.f = b;this.a = t(this.c, "span", { "aria-hidden": "true" }, this.f);
  }function O(a) {
    u(a.c, "body", a.a);
  }function P(a) {
    return "display:block;position:absolute;top:-9999px;left:-9999px;font-size:300px;width:auto;height:auto;line-height:normal;margin:0;padding:0;font-variant:normal;white-space:nowrap;font-family:" + J(a.c) + ";" + ("font-style:" + I(a) + ";font-weight:" + (a.f + "00") + ";");
  }function Q(a, b, c, d, e, f) {
    this.g = a;this.j = b;this.a = d;this.c = c;this.f = e || 3E3;this.h = f || void 0;
  }Q.prototype.start = function () {
    var a = this.c.m.document,
        b = this,
        c = q(),
        d = new Promise(function (d, e) {
      function k() {
        q() - c >= b.f ? e() : a.fonts.load(fa(b.a), b.h).then(function (a) {
          1 <= a.length ? d() : setTimeout(k, 25);
        }, function () {
          e();
        });
      }k();
    }),
        e = new Promise(function (a, d) {
      setTimeout(d, b.f);
    });Promise.race([e, d]).then(function () {
      b.g(b.a);
    }, function () {
      b.j(b.a);
    });
  };function R(a, b, c, d, e, f, g) {
    this.v = a;this.B = b;this.c = c;this.a = d;this.s = g || "BESbswy";this.f = {};this.w = e || 3E3;this.u = f || null;this.o = this.j = this.h = this.g = null;this.g = new N(this.c, this.s);this.h = new N(this.c, this.s);this.j = new N(this.c, this.s);this.o = new N(this.c, this.s);a = new H(this.a.c + ",serif", K(this.a));a = P(a);this.g.a.style.cssText = a;a = new H(this.a.c + ",sans-serif", K(this.a));a = P(a);this.h.a.style.cssText = a;a = new H("serif", K(this.a));a = P(a);this.j.a.style.cssText = a;a = new H("sans-serif", K(this.a));a = P(a);this.o.a.style.cssText = a;O(this.g);O(this.h);O(this.j);O(this.o);
  }var S = { D: "serif", C: "sans-serif" },
      T = null;function U() {
    if (null === T) {
      var a = /AppleWebKit\/([0-9]+)(?:\.([0-9]+))/.exec(window.navigator.userAgent);T = !!a && (536 > parseInt(a[1], 10) || 536 === parseInt(a[1], 10) && 11 >= parseInt(a[2], 10));
    }return T;
  }R.prototype.start = function () {
    this.f.serif = this.j.a.offsetWidth;this.f["sans-serif"] = this.o.a.offsetWidth;this.A = q();la(this);
  };
  function ma(a, b, c) {
    for (var d in S) {
      if (S.hasOwnProperty(d) && b === a.f[S[d]] && c === a.f[S[d]]) return !0;
    }return !1;
  }function la(a) {
    var b = a.g.a.offsetWidth,
        c = a.h.a.offsetWidth,
        d;(d = b === a.f.serif && c === a.f["sans-serif"]) || (d = U() && ma(a, b, c));d ? q() - a.A >= a.w ? U() && ma(a, b, c) && (null === a.u || a.u.hasOwnProperty(a.a.c)) ? V(a, a.v) : V(a, a.B) : na(a) : V(a, a.v);
  }function na(a) {
    setTimeout(p(function () {
      la(this);
    }, a), 50);
  }function V(a, b) {
    setTimeout(p(function () {
      v(this.g.a);v(this.h.a);v(this.j.a);v(this.o.a);b(this.a);
    }, a), 0);
  }function W(a, b, c) {
    this.c = a;this.a = b;this.f = 0;this.o = this.j = !1;this.s = c;
  }var X = null;W.prototype.g = function (a) {
    var b = this.a;b.g && w(b.f, [b.a.c("wf", a.c, K(a).toString(), "active")], [b.a.c("wf", a.c, K(a).toString(), "loading"), b.a.c("wf", a.c, K(a).toString(), "inactive")]);L(b, "fontactive", a);this.o = !0;oa(this);
  };
  W.prototype.h = function (a) {
    var b = this.a;if (b.g) {
      var c = y(b.f, b.a.c("wf", a.c, K(a).toString(), "active")),
          d = [],
          e = [b.a.c("wf", a.c, K(a).toString(), "loading")];c || d.push(b.a.c("wf", a.c, K(a).toString(), "inactive"));w(b.f, d, e);
    }L(b, "fontinactive", a);oa(this);
  };function oa(a) {
    0 == --a.f && a.j && (a.o ? (a = a.a, a.g && w(a.f, [a.a.c("wf", "active")], [a.a.c("wf", "loading"), a.a.c("wf", "inactive")]), L(a, "active")) : M(a.a));
  }function pa(a) {
    this.j = a;this.a = new ja();this.h = 0;this.f = this.g = !0;
  }pa.prototype.load = function (a) {
    this.c = new ca(this.j, a.context || this.j);this.g = !1 !== a.events;this.f = !1 !== a.classes;qa(this, new ha(this.c, a), a);
  };
  function ra(a, b, c, d, e) {
    var f = 0 == --a.h;(a.f || a.g) && setTimeout(function () {
      var a = e || null,
          k = d || null || {};if (0 === c.length && f) M(b.a);else {
        b.f += c.length;f && (b.j = f);var h,
            m = [];for (h = 0; h < c.length; h++) {
          var l = c[h],
              n = k[l.c],
              r = b.a,
              x = l;r.g && w(r.f, [r.a.c("wf", x.c, K(x).toString(), "loading")]);L(r, "fontloading", x);r = null;if (null === X) if (window.FontFace) {
            var x = /Gecko.*Firefox\/(\d+)/.exec(window.navigator.userAgent),
                ya = /OS X.*Version\/10\..*Safari/.exec(window.navigator.userAgent) && /Apple/.exec(window.navigator.vendor);
            X = x ? 42 < parseInt(x[1], 10) : ya ? !1 : !0;
          } else X = !1;X ? r = new Q(p(b.g, b), p(b.h, b), b.c, l, b.s, n) : r = new R(p(b.g, b), p(b.h, b), b.c, l, b.s, a, n);m.push(r);
        }for (h = 0; h < m.length; h++) {
          m[h].start();
        }
      }
    }, 0);
  }function qa(a, b, c) {
    var d = [],
        e = c.timeout;ia(b);var d = ka(a.a, c, a.c),
        f = new W(a.c, b, e);a.h = d.length;b = 0;for (c = d.length; b < c; b++) {
      d[b].load(function (b, d, c) {
        ra(a, f, b, d, c);
      });
    }
  }function sa(a, b) {
    this.c = a;this.a = b;
  }function ta(a, b, c) {
    var d = z(a.c);a = (a.a.api || "fast.fonts.net/jsapi").replace(/^.*http(s?):(\/\/)?/, "");return d + "//" + a + "/" + b + ".js" + (c ? "?v=" + c : "");
  }
  sa.prototype.load = function (a) {
    function b() {
      if (f["__mti_fntLst" + d]) {
        var c = f["__mti_fntLst" + d](),
            e = [],
            h;if (c) for (var m = 0; m < c.length; m++) {
          var l = c[m].fontfamily;void 0 != c[m].fontStyle && void 0 != c[m].fontWeight ? (h = c[m].fontStyle + c[m].fontWeight, e.push(new H(l, h))) : e.push(new H(l));
        }a(e);
      } else setTimeout(function () {
        b();
      }, 50);
    }var c = this,
        d = c.a.projectId,
        e = c.a.version;if (d) {
      var f = c.c.m;B(this.c, ta(c, d, e), function (e) {
        e ? a([]) : (f["__MonotypeConfiguration__" + d] = function () {
          return c.a;
        }, b());
      }).id = "__MonotypeAPIScript__" + d;
    } else a([]);
  };function ua(a, b) {
    this.c = a;this.a = b;
  }ua.prototype.load = function (a) {
    var b,
        c,
        d = this.a.urls || [],
        e = this.a.families || [],
        f = this.a.testStrings || {},
        g = new C();b = 0;for (c = d.length; b < c; b++) {
      A(this.c, d[b], D(g));
    }var k = [];b = 0;for (c = e.length; b < c; b++) {
      if (d = e[b].split(":"), d[1]) for (var h = d[1].split(","), m = 0; m < h.length; m += 1) {
        k.push(new H(d[0], h[m]));
      } else k.push(new H(d[0]));
    }F(g, function () {
      a(k, f);
    });
  };function va(a, b, c) {
    a ? this.c = a : this.c = b + wa;this.a = [];this.f = [];this.g = c || "";
  }var wa = "//fonts.googleapis.com/css";function xa(a, b) {
    for (var c = b.length, d = 0; d < c; d++) {
      var e = b[d].split(":");3 == e.length && a.f.push(e.pop());var f = "";2 == e.length && "" != e[1] && (f = ":");a.a.push(e.join(f));
    }
  }
  function za(a) {
    if (0 == a.a.length) throw Error("No fonts to load!");if (-1 != a.c.indexOf("kit=")) return a.c;for (var b = a.a.length, c = [], d = 0; d < b; d++) {
      c.push(a.a[d].replace(/ /g, "+"));
    }b = a.c + "?family=" + c.join("%7C");0 < a.f.length && (b += "&subset=" + a.f.join(","));0 < a.g.length && (b += "&text=" + encodeURIComponent(a.g));return b;
  }function Aa(a) {
    this.f = a;this.a = [];this.c = {};
  }
  var Ba = { latin: "BESbswy", "latin-ext": "\xE7\xF6\xFC\u011F\u015F", cyrillic: "\u0439\u044F\u0416", greek: "\u03B1\u03B2\u03A3", khmer: "\u1780\u1781\u1782", Hanuman: "\u1780\u1781\u1782" },
      Ca = { thin: "1", extralight: "2", "extra-light": "2", ultralight: "2", "ultra-light": "2", light: "3", regular: "4", book: "4", medium: "5", "semi-bold": "6", semibold: "6", "demi-bold": "6", demibold: "6", bold: "7", "extra-bold": "8", extrabold: "8", "ultra-bold": "8", ultrabold: "8", black: "9", heavy: "9", l: "3", r: "4", b: "7" },
      Da = { i: "i", italic: "i", n: "n", normal: "n" },
      Ea = /^(thin|(?:(?:extra|ultra)-?)?light|regular|book|medium|(?:(?:semi|demi|extra|ultra)-?)?bold|black|heavy|l|r|b|[1-9]00)?(n|i|normal|italic)?$/;
  function Fa(a) {
    for (var b = a.f.length, c = 0; c < b; c++) {
      var d = a.f[c].split(":"),
          e = d[0].replace(/\+/g, " "),
          f = ["n4"];if (2 <= d.length) {
        var g;var k = d[1];g = [];if (k) for (var k = k.split(","), h = k.length, m = 0; m < h; m++) {
          var l;l = k[m];if (l.match(/^[\w-]+$/)) {
            var n = Ea.exec(l.toLowerCase());if (null == n) l = "";else {
              l = n[2];l = null == l || "" == l ? "n" : Da[l];n = n[1];if (null == n || "" == n) n = "4";else var r = Ca[n],
                  n = r ? r : isNaN(n) ? "4" : n.substr(0, 1);l = [l, n].join("");
            }
          } else l = "";l && g.push(l);
        }0 < g.length && (f = g);3 == d.length && (d = d[2], g = [], d = d ? d.split(",") : g, 0 < d.length && (d = Ba[d[0]]) && (a.c[e] = d));
      }a.c[e] || (d = Ba[e]) && (a.c[e] = d);for (d = 0; d < f.length; d += 1) {
        a.a.push(new H(e, f[d]));
      }
    }
  }function Ga(a, b) {
    this.c = a;this.a = b;
  }var Ha = { Arimo: !0, Cousine: !0, Tinos: !0 };Ga.prototype.load = function (a) {
    var b = new C(),
        c = this.c,
        d = new va(this.a.api, z(c), this.a.text),
        e = this.a.families;xa(d, e);var f = new Aa(e);Fa(f);A(c, za(d), D(b));F(b, function () {
      a(f.a, f.c, Ha);
    });
  };function Ia(a, b) {
    this.c = a;this.a = b;
  }Ia.prototype.load = function (a) {
    var b = this.a.id,
        c = this.c.m;b ? B(this.c, (this.a.api || "https://use.typekit.net") + "/" + b + ".js", function (b) {
      if (b) a([]);else if (c.Typekit && c.Typekit.config && c.Typekit.config.fn) {
        b = c.Typekit.config.fn;for (var e = [], f = 0; f < b.length; f += 2) {
          for (var g = b[f], k = b[f + 1], h = 0; h < k.length; h++) {
            e.push(new H(g, k[h]));
          }
        }try {
          c.Typekit.load({ events: !1, classes: !1, async: !0 });
        } catch (m) {}a(e);
      }
    }, 2E3) : a([]);
  };function Ja(a, b) {
    this.c = a;this.f = b;this.a = [];
  }Ja.prototype.load = function (a) {
    var b = this.f.id,
        c = this.c.m,
        d = this;b ? (c.__webfontfontdeckmodule__ || (c.__webfontfontdeckmodule__ = {}), c.__webfontfontdeckmodule__[b] = function (b, c) {
      for (var g = 0, k = c.fonts.length; g < k; ++g) {
        var h = c.fonts[g];d.a.push(new H(h.name, ga("font-weight:" + h.weight + ";font-style:" + h.style)));
      }a(d.a);
    }, B(this.c, z(this.c) + (this.f.api || "//f.fontdeck.com/s/css/js/") + ea(this.c) + "/" + b + ".js", function (b) {
      b && a([]);
    })) : a([]);
  };var Y = new pa(window);Y.a.c.custom = function (a, b) {
    return new ua(b, a);
  };Y.a.c.fontdeck = function (a, b) {
    return new Ja(b, a);
  };Y.a.c.monotype = function (a, b) {
    return new sa(b, a);
  };Y.a.c.typekit = function (a, b) {
    return new Ia(b, a);
  };Y.a.c.google = function (a, b) {
    return new Ga(b, a);
  };
  var Z = { load: p(Y.load, Y) };
  window.WebFont = Z, window.WebFontConfig && Y.load(window.WebFontConfig);
  /*
  "function"===typeof define&&define.amd?
    define(function(){return Z}):
    "undefined"!==typeof module&&module.exports?
      module.exports=Z:
      (window.WebFont=Z,window.WebFontConfig&&Y.load(window.WebFontConfig));
  */
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
    // add @font-face for object.customFont.name and object.customFont.url
    var style = document.createElement('style');
    style.appendChild(document.createTextNode("@font-face {font-family: '" + object.customFont.name + "'; src: url('" + object.customFont.url + "');}"));
    document.head.appendChild(style);

    window.WebFont.load({
      custom: {
        families: [object.customFont.name]
      },
      active: function active() {
        object.customFont.loaded = true;
        MediaCache.set(object.customFont.url, object.customFont);
        resolve();
      },
      inactive: function inactive() {
        reject();
      }
    });
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
        type: 'font',
        default: '40pt Helvetica'
      }, {
        displayName: 'Color',
        type: 'group',
        properties: [{
          name: 'color',
          displayName: '',
          type: 'color',
          default: '#000000'
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
          width: 20
        }, {
          name: 'shadowBlur',
          displayName: 'blur',
          type: 'integer',
          default: '5',
          width: 20
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
        name: 'script',
        displayName: 'Script',
        type: 'script',
        default: ''
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
          default: '#000000'
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
      }, {
        name: 'script',
        displayName: 'Script',
        type: 'script',
        default: ''
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
          default: '#000000'
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
      }, {
        name: 'script',
        displayName: 'Script',
        type: 'script',
        default: ''
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

TransformElement.handleSize = 20;

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
  environment.context.translate(object.x, object.y);
  if (typeof object.rotation !== 'undefined') {
    environment.context.rotate(object.rotation * Math.PI / 180);
  }

  environment.context.lineWidth = 2;
  environment.context.setLineDash([8, 4]);
  environment.context.globalCompositeOperation = 'xor';
  environment.context.strokeStyle = 'rgba(127, 127, 127, 1.0)';

  // body
  environment.context.strokeRect(-object.width / 2, -object.height / 2, object.width, object.height);

  if (object.locked !== true) {
    // ul
    environment.context.strokeRect(-object.width / 2, -object.height / 2, TransformElement.handleSize, TransformElement.handleSize);
    // ur
    environment.context.strokeRect(object.width / 2 - TransformElement.handleSize, -object.height / 2, TransformElement.handleSize, TransformElement.handleSize);
    // lr
    environment.context.strokeRect(object.width / 2 - TransformElement.handleSize, object.height / 2 - TransformElement.handleSize, TransformElement.handleSize, TransformElement.handleSize);
    // ll
    environment.context.strokeRect(-object.width / 2, object.height / 2 - TransformElement.handleSize, TransformElement.handleSize, TransformElement.handleSize);

    // top
    environment.context.strokeRect(-10, -object.height / 2, TransformElement.handleSize, TransformElement.handleSize);
    // right
    environment.context.strokeRect(object.width / 2 - TransformElement.handleSize, -10, TransformElement.handleSize, TransformElement.handleSize);
    // bottom
    environment.context.strokeRect(-10, object.height / 2 - TransformElement.handleSize, TransformElement.handleSize, TransformElement.handleSize);
    // left
    environment.context.strokeRect(-object.width / 2, -10, TransformElement.handleSize, TransformElement.handleSize);

    // rotate handle
    environment.context.strokeRect(-10, -(object.height / 2) - TransformElement.handleSize * 2, TransformElement.handleSize, TransformElement.handleSize);
    // rotate connector
    environment.context.strokeRect(0, -(object.height / 2) - TransformElement.handleSize, 1, TransformElement.handleSize);
  }

  environment.context.restore();
};

TransformElement.findTransformHandle = function (environment, mouseX, mouseY, object) {
  var handles = ['ul', 'ur', 'll', 'lr', 'top', 'right', 'bottom', 'left', 'body', 'rotate'];
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
        environment.context.rect(-handleX, -handleY, TransformElement.handleSize, TransformElement.handleSize);
        break;
      case 'ur':
        // upper-right
        environment.context.rect(handleX - TransformElement.handleSize, -handleY, TransformElement.handleSize, TransformElement.handleSize);
        break;
      case 'll':
        // upper-right
        environment.context.rect(-handleX, handleY - TransformElement.handleSize, TransformElement.handleSize, TransformElement.handleSize);
        break;
      case 'lr':
        // upper-right
        environment.context.rect(handleX - TransformElement.handleSize, handleY - TransformElement.handleSize, TransformElement.handleSize, TransformElement.handleSize);
        break;
      case 'top':
        environment.context.rect(-10, -handleY, TransformElement.handleSize, TransformElement.handleSize);
        break;
      case 'right':
        environment.context.rect(handleX - TransformElement.handleSize, -10, TransformElement.handleSize, TransformElement.handleSize);
        break;
      case 'bottom':
        environment.context.rect(-10, handleY - TransformElement.handleSize, TransformElement.handleSize, TransformElement.handleSize);
        break;
      case 'left':
        environment.context.rect(-handleX, -10, TransformElement.handleSize, TransformElement.handleSize);
        break;
      case 'rotate':
        environment.context.rect(-TransformElement.handleSize / 2, -handleY - 40, TransformElement.handleSize, TransformElement.handleSize);
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

TransformElement.setObjectGeometry = function (src, dst) {
  dst.x = src.x;
  dst.y = src.y;
  dst.width = src.width;
  dst.height = src.height;
  dst.rotation = src.rotation;
};

TransformElement.snapToObject = function (object, hitObjects, event) {
  var hitObject;

  if (event.metaKey) {
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
      TransformElement.setObjectGeometry(object, object._transform.snapped);
    }
    // set the height/width and x, y of object to hitObject
    TransformElement.setObjectGeometry(hitObject, object);
  } else {
    // if we saved the orignal size, restore
    if (object._transform.snapped) {
      TransformElement.setObjectGeometry(object._transform.snapped, object);
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
  TransformElement.snapToObject(object, hitObjects, event);

  if (event.altKey) {
    TransformElement.snapObject(environment, object);
  }
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
    window.addEventListener('keydown', this._onKeyDown.bind(this));
    window.addEventListener('keyup', this._onKeyUp.bind(this));
    window.addEventListener('mousemove', this._onMouseMove.bind(this));
    window.addEventListener('mouseup', this._onMouseUp.bind(this));
    if (this._allowWindowDeselect) {
      window.addEventListener('mousedown', this._onWindowMouseDown.bind(this));
    }
  }

  this.setSize(width, height);
  this.setObjects(objects);
};
Hemp.prototype.constructor = Hemp;
Hemp.ElementFactory = ElementFactory;

// -----------------------------------------------------------------------------

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
      this._environment.canvas.removeEventListener('mousedown', this._onMouseDown.bind(this));
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
  }

  // if we have user interaction, setup for canvas mousedowns
  if (this._interactive) {
    this._environment.canvas.setAttribute('tabIndex', '1');
    this._environment.canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
  }
};

Hemp.prototype.destroy = function () {
  if (this._interactive) {
    window.removeEventListener('keydown', this._onKeyDown);
    window.removeEventListener('keyup', this._onKeyUp);
    window.removeEventListener('mousemove', this._onMouseMove);
    window.removeEventListener('mouseup', this._onMouseUp);
    if (this._allowWindowDeselect) {
      window.removeEventListener('mousedown', this._onWindowMouseDown);
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
  if (this._interactive) {
    clearTimeout(this._setObjectsTimeout);
    this._setObjectsTimeout = setTimeout(function () {
      this._setObjects(objects, callback);
    }.bind(this), 100);
  } else {
    this._setObjects(objects, callback);
  }
};

Hemp.prototype._setObjects = function (objects, callback) {
  objects = objects && Array.isArray(objects) ? objects : [];

  // deselect any existing objects, then update the internal list of objects
  var selectedObjects;
  if (this._interactive) {
    if (this._objects && objects.length === this._objects.length) {
      selectedObjects = this._getObjects({ name: '_selected', value: true, op: 'eq' });
    } else {
      this._deselectAllObjects(true);
    }
  }

  this._objects = objects; // this._cleanObjects(objects);

  var promises = [];
  this._objects.forEach(function (object, index) {
    // setup object index to make referencing the object easier later
    object._index = index;
    // setup the rendering element for this object type
    this._createPrivateProperty(object, '_element', ElementFactory.getElement(object));
    this._createPrivateProperty(object, '_imageLoaded', false);
    // if this element needs to load media, add a promise for that here
    if (object._element.needsPreload(object)) {
      var promise = object._element.preload(object, this._mediaReflectorUrl);
      if (promise) {
        promises.push(promise);
      }
    }
  }.bind(this));

  if (selectedObjects) {
    selectedObjects.forEach(function (object) {
      this._selectObject(this._objects[object._index], true);
    }.bind(this));
  }

  this.render();

  // once media is loaded, render again and perform the callback
  if (promises.length > 0) {
    if (this._interactive) {

      promises.forEach(function (promise) {
        promise.then(function () {
          this._finishLoading(callback);
        }.bind(this), function () {
          this._finishLoading(callback);
        }.bind(this));
      }.bind(this));
    } else {

      Promise.all(promises).then(function () {
        this._finishLoading(callback);
      }.bind(this), function () {
        this._finishLoading(callback);
      }.bind(this));
    }
  } else {
    this._finishLoading(callback);
  }
};

Hemp.prototype._finishLoading = function (callback) {
  this.render();
  if (typeof callback === 'function') {
    callback(this._objects);
  }
};

Hemp.prototype.getObjects = function () {
  return this._cleanObjects(this._objects).map(function (object) {
    delete object._index;
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
  this._deselectAllObjects(true);
  if (typeof object !== 'undefined') {
    if (object._index < this._objects.length) {
      this._selectObject(this._objects[object._index], true);
    }
  }
};

Hemp.prototype.deselect = function (object) {
  this._deselectAllObjects(true);
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
  //var selectedObjects = this._getObjects({name: '_selected', value: true, op: 'eq'});
  //var offset = event.altKey ? 10 : 1;
  switch (event.code) {
    case 'Escape':
      this._deselectAllObjects();
      break;
    /*
    case 'ArrowLeft':
    if (selectedObjects.length > 0) {
      this._nudgeObject(selectedObjects[0], -offset, 0, event);
    }
    break;
    case 'ArrowRight':
    if (selectedObjects.length > 0) {
      this._nudgeObject(selectedObjects[0], offset, 0, event);
    }
    break;
    case 'ArrowUp':
    if (selectedObjects.length > 0) {
      this._nudgeObject(selectedObjects[0], 0, -offset, event);
    }
    break;
    case 'ArrowDown':
    if (selectedObjects.length > 0) {
      this._nudgeObject(selectedObjects[0], 0, offset, event);
    }
    break;
    */
    case 'MetaLeft':
    case 'MetaRight':
      if (this._mouse) {
        event.clientX = this._mouse.x;
        event.clientY = this._mouse.y;
        this._onMouseMove(event);
      }
      break;
    default:
      console.log('_onKeyDown event.code:', event.code);
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
  var coordinates = Hemp.windowToCanvas(this._environment, event);
  var hitObjects = this._findObjectsAt(coordinates.x, coordinates.y);

  this._transformStart = Date.now();
  this._transformFrames = 0;

  event.preventDefault();

  // if there's already a selected object, transform it if possible
  if (this._setupTransformingObject(coordinates.x, coordinates.y, event, hitObjects)) {
    return;
  }

  // if we hit an object, select it and start transforming it if possible
  if (hitObjects.length > 0) {
    var hitObject = hitObjects[hitObjects.length - 1];
    if (hitObject._selected !== true) {
      this._deselectAllObjects();
      this._selectObject(hitObject);
    }
    this._setupTransformingObject(coordinates.x, coordinates.y, event);
  }
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
    if (event.metaKey) {
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
};

Hemp.prototype._deselectAllObjects = function (skipEvent) {
  var deselectedObjects = [];
  this._getObjects().forEach(function (object) {
    if (object._selected) {
      deselectedObjects.push(object);
    }
    delete object._selected;
  });
  this._renderObjects(this._environment);
  if (deselectedObjects.length > 0) {
    if (this._element && skipEvent !== true) {
      this._element.dispatchEvent(new CustomEvent('deselect', { detail: this._cleanObjects(deselectedObjects) }));
    }
  }
};

Hemp.prototype._selectObject = function (object, skipEvent) {
  this._deselectAllObjects(skipEvent);
  this._createPrivateProperty(object, '_selected', true);
  this._renderObjects(this._environment);
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

Hemp.prototype._findObjectsAt = function (x, y) {
  var results = [];
  if (!this._hitEnvironment) {
    this._hitEnvironment = this._setupRenderEnvironment({
      width: this._width,
      height: this._height
    }, {
      selectionRender: true
    });
  }
  this._getObjects().forEach(function (object) {
    this._clearEnvironment(this._hitEnvironment);
    this._renderObject(this._hitEnvironment, object);
    var hitboxSize = 10; // make this configurable
    var p = this._hitEnvironment.context.getImageData(x - hitboxSize / 2, y - hitboxSize / 2, hitboxSize, hitboxSize).data;
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
    context: context
  };
};

Hemp.prototype._clearEnvironment = function (environment) {
  environment.context.clearRect(0, 0, environment.canvas.width, environment.canvas.height);
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
