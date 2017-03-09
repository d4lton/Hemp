'use strict';

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
  this.setupCanvas(environment, object);
  this.renderElement(environment, object);
  this.renderCanvas(environment, object);
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
    this._context.fillStyle = this.resolveColor(environment, object.backgroundColor);
    this._context.fillRect(0, 0, object.width, object.height);
    this._context.restore();
  }
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
  environment.context.drawImage(this._canvas, -object.width / 2, -object.height / 2);
  environment.context.restore();
};

Element.prototype.resolveColor = function (environment, color) {
  if (environment.options && environment.options.selectionRender) {
    return 'black';
  } else {
    return color;
  }
};

Element.getTypes = function () {
  console.warn('override me');
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

ImageElement.prototype._getFillSourceAndOffset = function (src, dst) {
  var sourceWidth = src.width;
  var sourceHeight = sourceWidth * (dst.height / dst.width);
  if (sourceHeight > src.height) {
    sourceWidth = src.height * (dst.width / dst.height);
    sourceHeight = src.height;
  }
  var offsetX = Math.max(0, src.width - sourceWidth) / 2;
  var offsetY = Math.max(0, src.height - sourceHeight) / 2;
  return {
    source: {
      width: sourceWidth,
      height: sourceHeight
    },
    offset: {
      x: offsetX,
      y: offsetY
    }
  };
};

ImageElement.prototype.renderElement = function (environment, object) {
  if (object._image) {
    try {
      var sourceAndOffset = this._getFillSourceAndOffset(object._image, object);
      this._context.drawImage(object._image, sourceAndOffset.offset.x, sourceAndOffset.offset.y, sourceAndOffset.source.width, sourceAndOffset.source.height, 0, 0, object.width, object.height);
    } catch (e) {}
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
        default: '{{image_link}}'
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
* Canvas Text
*
* Copyright ©2017 Dana Basken <dbasken@gmail.com>
*
*/

var CanvasText = {

  M_HEIGHT_FACTOR: 1.2,
  DEFAULT_FONT_SIZE: 12,
  DEFAULT_FONT_FAMILY: 'Comic Sans MS',
  DEFAULT_FONT_COLOR: '#000000',
  FONT_HEIGHT_METHOD: 'canvas', // fontSize, measureM, dom, canvas

  fontHeightCache: {},

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
    context.textBaseline = 'hanging';
    context.fillStyle = object.color ? object.color : CanvasText.DEFAULT_FONT_COLOR;
    context.textAlign = object.align;

    var offset = CanvasText.resolveShadowOffset(object);
    context.shadowColor = object.shadowColor;
    context.shadowBlur = object.shadowBlur;
    context.shadowOffsetX = offset.x;
    context.shadowOffsetY = offset.y;

    CanvasText.renderWordWrapRows(context, object, CanvasText.makeWordWrapRows(context, object));

    context.restore();
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

  resolvePadding: function resolvePadding(object) {
    var padding = {};
    var defaultPadding = typeof object.padding !== 'undefined' ? object.padding : 0;
    padding.left = typeof object.paddingLeft !== 'undefined' ? object.paddingLeft : defaultPadding;
    padding.right = typeof object.paddingRight !== 'undefined' ? object.paddingRight : defaultPadding;
    padding.top = typeof object.paddingTop !== 'undefined' ? object.paddingTop : defaultPadding;
    padding.bottom = typeof object.paddingBottom !== 'undefined' ? object.paddingBottom : defaultPadding;
    return padding;
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

  calculateRowWidth: function calculateRowWidth(context, object, text) {
    return context.measureText(text).width + this._padding.left + this._padding.right;
  },

  renderWordWrapRows: function renderWordWrapRows(context, object, rows) {
    var lineHeight = object.lineHeight ? object.lineHeight : 1;
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

    rows.forEach(function (row) {
      /*
      var rowCanvas = CanvasText.makeWordWrapCanvas(context, object, rowX, rowHeight, row);
      context.drawImage(rowCanvas, 0, rowY);
      */
      context.fillText(row, rowX, rowY);
      rowY += rowHeight;
    });
  },

  makeWordWrapCanvas: function makeWordWrapCanvas(context, object, xPos, height, text) {
    var canvas = document.createElement('canvas');
    var rowContext = canvas.getContext('2d');

    canvas.width = context.canvas.width;
    canvas.height = height;

    rowContext.font = context.font;
    rowContext.fillStyle = context.fillStyle;
    rowContext.textBaseline = context.textBaseline;
    rowContext.textAlign = object.align;

    rowContext.shadowColor = object.shadowColor;
    rowContext.shadowBlur = object.shadowBlur;

    var offset = CanvasText.resolveShadowOffset(object);
    rowContext.shadowOffsetX = offset.x;
    rowContext.shadowOffsetY = offset.y;

    rowContext.fillText(text, xPos, 0);

    return canvas;
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

  fontHeight: function fontHeight(context, object) {
    // why oh why does context.measureText() not return height?
    if (!CanvasText.fontHeightCache[context.font]) {
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
    var testString = 'Mjqye';
    var fontSize = parseInt(CanvasText.resolveFont(object));
    var canvas = document.createElement('canvas');
    canvas.height = fontSize * 2;
    canvas.width = context.measureText(testString).width;
    var fontContext = canvas.getContext('2d');
    fontContext.font = context.font;
    fontContext.textAlign = 'left';
    fontContext.textBaseline = 'top';
    fontContext.fillText(testString, 5, 5);
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
    return last - first;
  }

};

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

TextElement.prototype.renderElement = function (environment, object) {
  if (environment.options && environment.options.selectionRender) {
    this._context.fillStyle = this.resolveColor(environment, object.color);
    this._context.fillRect(0, 0, object.width, object.height);
    return;
  }
  CanvasText.drawText(this._context, object);
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
        name: 'color',
        displayName: 'Color',
        type: 'color',
        default: '#000000'
      }, {
        name: 'align',
        displayName: 'Alignment',
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
  this._context.fillStyle = this.resolveColor(environment, object.color);
  this._context.fillRect(0, 0, object.width, object.height);
};

ShapeElement.prototype.renderEllipse = function (environment, object) {
  this._context.save();
  this._context.beginPath();
  this._context.scale(object.width / 2, object.height / 2);
  this._context.arc(1, 1, 1, 0, 2 * Math.PI, false);
  this._context.restore();

  this._context.fillStyle = this.resolveColor(environment, object.color);
  this._context.fill();
};

ShapeElement.getTypes = function () {
  return {
    rectangle: {
      displayName: 'Rectangle',
      properties: [{
        name: 'color',
        displayName: 'Color',
        type: 'color',
        default: '#000000'
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
    },
    ellipse: {
      displayName: 'Ellipse',
      properties: [{
        name: 'color',
        displayName: 'Color',
        type: 'color',
        default: '#000000'
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

TransformElement.handleSize = 20;

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

  environment.context.lineWidth = 4;
  environment.context.globalCompositeOperation = 'xor';
  environment.context.strokeStyle = 'rgba(0, 0, 0, 0.5)';

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

  this._renderObjects(this._environment);
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
  objects = objects && Array.isArray(objects) ? objects : [];

  // deselect any existing objects, then update the internal list of objects
  var selectedObjects;
  if (this._objects && objects.length === this._objects.length) {
    selectedObjects = this._getObjects({ name: '_selected', value: true, op: 'eq' });
  } else {
    this._deselectAllObjects(true);
  }

  this._objects = objects; // this._cleanObjects(objects);

  this._objects.forEach(function (object, index) {
    object._index = index;
  });

  if (selectedObjects) {
    selectedObjects.forEach(function (object) {
      this._selectObject(this._objects[object._index], true);
    }.bind(this));
  }

  // create an array of promises for all image objects
  var promises = this._getImagePromises(this._objects);

  // once all images are loaded, set the internal list of objects and render
  Promise.all(promises).then(function (images) {
    this.render();
    if (typeof callback === 'function') {
      callback();
    }
  }.bind(this), function (reason) {
    console.error(reason);
  });
};

Hemp.prototype._getImagePromises = function (objects) {
  return objects.filter(function (object) {
    return object.type === 'image';
  }).map(function (object) {
    return new Promise(function (resolve, reject) {
      var image = Hemp.ImageCache.get(object.url);
      if (image) {
        this._createPrivateProperty(object, '_image', image);
        resolve();
      } else {
        this._createPrivateProperty(object, '_image', new Image());
        object._image.setAttribute('crossOrigin', 'anonymous');
        object._image.onload = function () {
          Hemp.ImageCache.set(object.url, object._image);
          resolve();
        };
        object._image.onerror = function (reason) {
          object._image = this._createFailureImage();
          resolve();
        }.bind(this);
        object._image.src = object.url;
      }
    }.bind(this));
  }.bind(this));
};

Hemp.prototype._createFailureImage = function () {
  // TODO: this should generate an image with some kind of helpful message
  return new Image();
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
    this._selectObject(this._objects[object._index], true);
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
      event.clientX = this._mouse.x;
      event.clientY = this._mouse.y;
      this._onMouseMove(event);
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
      event.clientX = this._mouse.x;
      event.clientY = this._mouse.y;
      this._onMouseMove(event);
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
  this._renderObject(environment, transformObject);
};

Hemp.prototype._createPrivateProperty = function (object, property, value) {
  Object.defineProperty(object, property, { enumerable: false, configurable: true, writable: true, value: value });
};

Hemp.prototype._renderObject = function (environment, object) {
  if (!object._element) {
    this._createPrivateProperty(object, '_element', ElementFactory.getElement(object));
  }
  var options = {};
  object._element.render(environment, object, options);
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

Hemp.ImageCache = {
  _images: {},
  _maxAgeMs: 300000,
  get: function get(key) {
    this._age();
    var entry = this._images[key];
    if (entry) {
      entry.hitMs = Date.now();
      return entry.image;
    }
  },
  set: function set(key, image) {
    this._images[key] = {
      hitMs: Date.now(),
      image: image
    };
    this._age();
  },
  _age: function _age() {
    var cutoffMs = Date.now() - this._maxAgeMs;
    Object.keys(this._images).forEach(function (key) {
      if (this._images[key].hitMs < cutoffMs) {
        delete this._images[key];
      }
    }.bind(this));
  }
};

module.exports = Hemp;
