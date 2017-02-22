'use strict';

/**
 * Base Element object
 */

function Element() {}

/************************************************************************************/

Element.prototype.render = function (context, object) {
	this.setupCanvas(object);
	this.renderElement(object);
	this.renderCanvas(context, object);
};

Element.prototype.setupCanvas = function (object) {
	this.canvas = document.createElement('canvas');
	this.context = this.canvas.getContext('2d');
	this.canvas.width = object.width;
	this.canvas.height = object.height;
	if (object.backgroundColor) {
		this.context.save();
		this.context.fillStyle = object.backgroundColor;
		this.context.fillRect(0, 0, object.width, object.height);
		this.context.restore();
	}
};

Element.prototype.renderElement = function (object) {
	console.warn('override me');
};

Element.prototype.renderCanvas = function (context, object) {
	context.save();
	context.translate(object.x, object.y);
	if (object.rotation) {
		context.rotate(object.rotation * Math.PI / 180);
	}
	if (typeof object.opacity !== 'undefined') {
		context.globalAlpha = object.opacity;
	}
	context.drawImage(this.canvas, -object.width / 2, -object.height / 2);
	context.restore();
};

/**
 * Image Element
 */

function ImageElement() {
  Element.call(this);
}

ImageElement.prototype = Object.create(Element.prototype);
ImageElement.prototype.constructor = ImageElement;

/************************************************************************************/

ImageElement.prototype.renderElement = function (object) {
  //var sourceAndOffset = Utilities.getFillSourceAndOffset(object.image, object);
  //this.context.drawImage(object.image, sourceAndOffset.offset.x, sourceAndOffset.offset.y, sourceAndOffset.source.width, sourceAndOffset.source.height, 0, 0, object.width, object.height);
};

/**
 * Canvas Text
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

var CanvasText$1 = {

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
        var fontSize = object.fontSize ? object.fontSize : CanvasText$1.DEFAULT_FONT_SIZE;
        var fontFamily = object.fontFamily ? object.fontFamily : CanvasText$1.DEFAULT_FONT_FAMILY;

        context.save();

        context.font = fontSize + "pt '" + fontFamily + "'";
        context.textBaseline = 'hanging';
        context.fillStyle = object.color ? object.color : CanvasText$1.DEFAULT_FONT_COLOR;

        CanvasText$1.resolvePadding(object);

        CanvasText$1.renderWordWrapRows(context, object, CanvasText$1.makeWordWrapRows(context, object));

        context.restore();
    },

    resolvePadding: function resolvePadding(object) {
        object.padding = typeof object.padding !== 'undefined' ? object.padding : 0;
        object.paddingLeft = typeof object.paddingLeft !== 'undefined' ? object.paddingLeft : object.padding;
        object.paddingRight = typeof object.paddingRight !== 'undefined' ? object.paddingRight : object.padding;
        object.paddingTop = typeof object.paddingTop !== 'undefined' ? object.paddingTop : object.padding;
        object.paddingBottom = typeof object.paddingBottom !== 'undefined' ? object.paddingBottom : object.padding;
    },

    makeWordWrapRows: function makeWordWrapRows(context, object) {
        var words = object.text.split(/ /);
        var spaceWidth = context.measureText(' ').width;
        var rowWidth = CanvasText$1.calculateRowWidth(context, object, '');
        var rowWords = [];
        var rows = [];
        words.forEach(function (word) {
            var width = context.measureText(word).width;
            if (rowWidth + width >= context.canvas.width) {
                rows.push(rowWords.join(' '));
                rowWords = [];
                rowWidth = CanvasText$1.calculateRowWidth(context, object, '');
            }
            rowWords.push(word);
            rowWidth = CanvasText$1.calculateRowWidth(context, object, rowWords.join(' '));
        });
        if (rowWords.length > 0) {
            rows.push(rowWords.join(' '));
        }
        return rows;
    },

    calculateRowWidth: function calculateRowWidth(context, object, text) {
        return context.measureText(text).width + (object.paddingLeft + object.paddingRight);
    },

    renderWordWrapRows: function renderWordWrapRows(context, object, rows) {
        var lineHeight = object.lineHeight ? object.lineHeight : 1;
        var rowHeight = CanvasText$1.fontHeight(context, object) * lineHeight;

        var rowX = object.paddingLeft;
        if (object.align === 'right') {
            rowX = context.canvas.width - object.paddingRight;
        }
        if (object.align === 'center') {
            rowX = context.canvas.width / 2;
        }

        var rowY = object.paddingTop;
        if (object.valign === 'bottom') {
            rowY = context.canvas.height - rows.length * rowHeight - object.paddingBottom;
        }
        if (object.valign === 'middle') {
            rowY = (context.canvas.height - rows.length * rowHeight) / 2;
        }

        rows.forEach(function (row) {
            var rowCanvas = CanvasText$1.makeWordWrapCanvas(context, object, rowX, rowHeight, row);
            context.drawImage(rowCanvas, 0, rowY);
            rowY += rowCanvas.height;
        });
    },

    fontHeight: function fontHeight(context, object) {
        // why oh why does context.measureText() not return height?
        if (!CanvasText$1.fontHeightCache[context.font]) {
            switch (CanvasText$1.FONT_HEIGHT_METHOD) {
                case 'fontSize':
                    var fontSize = object.fontSize ? object.fontSize : CanvasText$1.DEFAULT_FONT_SIZE;
                    CanvasText$1.fontHeightCache[context.font] = fontSize * CanvasText$1.M_HEIGHT_FACTOR;
                    break;
                case 'measureM':
                    CanvasText$1.fontHeightCache[context.font] = context.measureText('M').width * CanvasText$1.M_HEIGHT_FACTOR;
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
                    CanvasText$1.fontHeightCache[context.font] = size.height;
                    break;
                case 'canvas':
                    CanvasText$1.fontHeightCache[context.font] = CanvasText$1.canvasFontHeight(context, object);
                    break;
            }
        }
        return CanvasText$1.fontHeightCache[context.font];
    },

    canvasFontHeight: function canvasFontHeight(context, object) {
        var testString = 'Mjqye';
        var fontSize = object.fontSize ? object.fontSize : CanvasText$1.DEFAULT_FONT_SIZE;
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

        rowContext.fillText(text, xPos, 0);
        return canvas;
    }

};

/**
 * Text Element
 */

function TextElement() {
  Element.call(this);
}

TextElement.prototype = Object.create(Element.prototype);
TextElement.prototype.constructor = TextElement;

/************************************************************************************/

TextElement.prototype.renderElement = function (object) {
  CanvasText$1.drawText(this.context, object);
};

/**
 * Shape Element
 */

function ShapeElement(type) {
  Element.call(this);
  this.type = type;
}

ShapeElement.prototype = Object.create(Element.prototype);
ShapeElement.prototype.constructor = ShapeElement;

/************************************************************************************/

ShapeElement.prototype.renderElement = function (object) {
  switch (this.type) {
    case 'rectangle':
      this.renderRectangle(object);
      break;
    case 'ellipse':
      this.renderEllipse(object);
      break;
    default:
      throw new Error('Unknown shape type: ' + type);
  }
};

ShapeElement.prototype.renderRectangle = function (object) {
  this.context.save();
  this.context.fillStyle = object.color;
  this.context.fillRect(0, 0, object.width, object.height);
  this.context.restore();
};

ShapeElement.prototype.renderEllipse = function (object) {
  this.context.save();

  this.context.save();
  this.context.beginPath();
  this.context.scale(object.width / 2, object.height / 2);
  this.context.arc(1, 1, 1, 0, 2 * Math.PI, false);
  this.context.restore();

  this.context.fillStyle = object.color;
  this.context.fill();

  this.context.restore();
};

var ElementFactory = {};

ElementFactory.getElement = function (type) {
	var element;
	switch (type) {
		case 'image':
			element = new ImageElement();
			break;
		case 'text':
			element = new TextElement();
			break;
		case 'rectangle':
		case 'ellipse':
			element = new ShapeElement(type);
			break;
		default:
			throw new Error('Element ' + type + ' is not supported');
			break;
	}
	return element;
};

var Hemp = function Hemp(selector, width, height, objects) {
  this._element = this._findElement(selector);
  this._width = width;
  this._height = height;
  this._objects = objects ? objects : [];

  this._environment = this._setupRenderEnvironment({
    width: this._width,
    height: this._height
  });

  this._environment.canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
  this._environment.canvas.addEventListener('mousemove', this._onMouseMove.bind(this));
  this._environment.canvas.addEventListener('mouseup', this._onMouseUp.bind(this));

  this._element.append(this._environment.canvas);

  this._setupObserver();
  this._handleElementResize();

  this._renderObjects(this._environment);
};
Hemp.prototype.constructor = Hemp;

Hemp.prototype._createCanvas = function (width, height) {
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

Hemp.prototype._setupContext = function (canvas) {
  return canvas.getContext('2d');
};

Hemp.prototype._setupObserver = function () {
  var observer = new MutationObserver(function (mutations) {
    this._handleElementResize();
  }.bind(this));
  observer.observe(this._element, {
    attributes: true, childList: true, characterData: true
  });
};

Hemp.prototype._handleElementResize = function () {
  var rect = this._environment.canvas.getBoundingClientRect();
  this._windowToCanvas = function (x, y) {
    return {
      x: x * (this._width / rect.width),
      y: y * (this._height / rect.height)
    };
  };
};

Hemp.prototype._findElement = function (selector) {
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
  throw new Error('Could not find selector: ' + selector);
};

Hemp.prototype._onMouseDown = function (event) {
  var coordinates = this._windowToCanvas(event.offsetX, event.offsetY);
  var hitObjects = this._findObjectsAt(coordinates.x, coordinates.y);

  // if there's already a selected object, transform it if possible
  if (this._setupTransformingObject(coordinates.x, coordinates.y)) {
    return;
  }

  // deselect any selected objects
  this._deselectAllObjects();

  // if we hit an object, select it and start transforming it if possible
  if (hitObjects.length > 0) {
    this._selectObject(hitObjects[hitObjects.length - 1]);
    this._setupTransformingObject(coordinates.x, coordinates.y);
  }
};

Hemp.prototype._setupTransformingObject = function (mouseX, mouseY) {
  var selectedObjects = this._getObjects({ name: 'selected', value: true, op: '==' });
  if (selectedObjects.length > 0) {
    this._transformHandle = this._findTransformHandle(mouseX, mouseY, selectedObjects[0]);
    if (this._transformHandle) {
      this._transformingObject = selectedObjects[0];
      return true;
    }
  }
  return false;
};

Hemp.prototype._findTransformHandle = function (mouseX, mouseY, object) {
  var handles = ['ul', 'ur', 'll', 'lr', 'body'];
  for (var i = 0; i < handles.length; i++) {
    var handle = handles[i];

    this._environment.context.save();
    this._environment.context.translate(object.x, object.y);
    this._environment.context.rotate(object.rotation * Math.PI / 180);

    this._environment.context.beginPath();
    var handleSize = 20; // TODO: make this configurable
    var handleX = object.width / 2 - handleSize;
    var handleY = object.height / 2 - handleSize;
    switch (handle) {
      case 'ul':
        // upper-left
        this._environment.context.arc(-handleX, -handleY, handleSize, 0, 2 * Math.PI, false);
        break;
      case 'ur':
        // upper-right
        this._environment.context.arc(handleX, -handleY, handleSize, 0, 2 * Math.PI, false);
        break;
      case 'll':
        // upper-right
        this._environment.context.arc(-handleX, handleY, handleSize, 0, 2 * Math.PI, false);
        break;
      case 'lr':
        // upper-right
        this._environment.context.arc(handleX, handleY, handleSize, 0, 2 * Math.PI, false);
        break;
      case 'body':
        this._environment.context.rect(-object.width / 2, -object.height / 2, object.width, object.height);
        break;
    }
    //this._environment.context.fill();
    var hit = this._environment.context.isPointInPath(mouseX, mouseY);
    this._environment.context.restore();
    if (hit) {
      return handle;
      
    }
  }
};

Hemp.prototype._onMouseMove = function (event) {
  // if we're in the middle of a transform, update the selected object and render the canvas
  if (this._transformHandle) {
    var coordinates = this._windowToCanvas(event.offsetX, event.offsetY);
    this._transformObject(coordinates.x, coordinates.y, this._transformingObject, this._transformHandle);
    this._renderObjects(this._environment);
  }
};

Hemp.prototype._transformObject = function (mouseX, mouseY, object, handle) {
  var radians = -object.rotation * Math.PI / 180;
  // get the current top-left and bottom-right coordinates of the bounding rect
  var x1 = object.x - object.width / 2;
  var y1 = object.y - object.height / 2;
  var x2 = x1 + object.width;
  var y2 = y1 + object.height;

  // rotate the mouse coordinates to match the object rotation
  mouseX = object.x + Math.cos(radians) * (mouseX - object.x) - Math.sin(radians) * (mouseY - object.y);
  mouseY = object.y + Math.sin(radians) * (mouseX - object.x) + Math.cos(radians) * (mouseY - object.y);
  switch (handle) {
    case 'ul':
      object.width = x2 - mouseX;
      object.x = mouseX + object.width / 2;
      object.height = y2 - mouseY;
      object.y = mouseY + object.height / 2;
      break;
    case 'ur':
      object.width = mouseX - x1;
      object.x = x1 + object.width / 2;
      object.height = y2 - mouseY;
      object.y = mouseY + object.height / 2;
      break;
    case 'll':
      object.width = x2 - mouseX;
      object.x = mouseX + object.width / 2;
      object.height = mouseY - y1;
      object.y = y1 + object.height / 2;
      break;
    case 'lr':
      object.width = mouseX - x1;
      object.x = x1 + object.width / 2;
      object.height = mouseY - y1;
      object.y = y1 + object.height / 2;
      break;
    case 'body':
      object.x = mouseX;
      object.y = mouseY;
      break;
  }
};

Hemp.prototype._onMouseUp = function (event) {
  if (this._transformHandle) {
    delete this._transformHandle;
  }
};

Hemp.prototype._deselectAllObjects = function () {
  this._getObjects().forEach(function (object) {
    object.selected = false;
  });
  this._renderObjects(this._environment);
};

Hemp.prototype._selectObject = function (object) {
  this._deselectAllObjects();
  object.selected = true;
  this._renderObjects(this._environment);
};

Hemp.prototype._getObjects = function (filter) {
  if (Array.isArray(this._objects)) {
    if (filter) {
      return this._objects.filter(function (object) {
        switch (filter.op) {
          case '==':
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
    if (object.selected) {
      selectedObject = object;
    }
    this._renderObject(environment, object);
  }.bind(this));
  if (selectedObject) {
    this._renderTransformBoxForObject(environment, selectedObject);
  }
};

Hemp.prototype._renderTransformBoxForObject = function (environment, object) {
  environment.context.save();

  var transformObject = {
    height: environment.canvas.height,
    width: environment.canvas.width

  };
  //var transformObject = JSON.parse(JSON.stringify(object));

  transformObject.height = environment.canvas.height;
  transformObject.width = environment.canvas.width;
  var transformEnvironment = this._setupRenderEnvironment(transformObject);
  environment.context.translate(object.x, object.y);
  environment.context.rotate(object.rotation * Math.PI / 180);
  environment.context.lineWidth = 8;
  environment.context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  environment.context.strokeRect(-object.width / 2, -object.height / 2, object.width, object.height);
  environment.context.strokeRect(-object.width / 2, -object.height / 2, 20, 20);
  environment.context.strokeRect(object.width / 2 - 20, -object.height / 2, 20, 20);
  environment.context.strokeRect(object.width / 2 - 20, object.height / 2 - 20, 20, 20);
  environment.context.strokeRect(-object.width / 2, object.height / 2 - 20, 20, 20);

  environment.context.restore();
};

Hemp.prototype._renderObject = function (environment, object) {
  environment.context.save();
  //var objectEnvironment = this._setupRenderEnvironment(object, environment.options);

  var element = ElementFactory.getElement(object.type);
  element.render(environment.context, object);

  /*  
    switch (object.type) {
      case 'rectangle':
        this._renderRectangle(objectEnvironment, object);
        break;
      case 'ellipse':
        this._renderEllipse(objectEnvironment, object);
        break;
      case 'text':
        this._renderText(objectEnvironment, object);
        break;
    }
    this._renderObjectToCanvas(environment, objectEnvironment, object);
    */
  environment.context.restore();
};

Hemp.prototype._setupRenderEnvironment = function (object, options) {
  var canvas = this._createCanvas(object.width, object.height);
  var context = this._setupContext(canvas);
  if (object.backgroundColor) {
    context.save();
    context.fillStyle = object.backgroundColor;
    context.fillRect(0, 0, object.width, object.height);
    context.restore();
  }
  return {
    options: options ? options : {},
    canvas: canvas,
    context: context
  };
};

Hemp.prototype._renderObjectToCanvas = function (environment, objectEnvironment, object) {
  environment.context.save();
  environment.context.translate(object.x, object.y);
  if (object.rotation) {
    environment.context.rotate(object.rotation * Math.PI / 180);
  }
  if (typeof object.opacity !== 'undefined' && !environment.options.selectionRender) {
    environment.context.globalAlpha = object.opacity;
  }
  environment.context.drawImage(objectEnvironment.canvas, -object.width / 2, -object.height / 2);
  environment.context.restore();
};

Hemp.prototype._clearEnvironment = function (environment) {
  environment.context.clearRect(0, 0, environment.canvas.width, environment.canvas.height);
};

Hemp.prototype._renderRectangle = function (environment, object) {
  this._setColor(environment, object);
  environment.context.fillRect(0, 0, object.width, object.height);
};

Hemp.prototype._renderEllipse = function (environment, object) {
  environment.context.save();
  environment.context.beginPath();
  environment.context.scale(object.width / 2, object.height / 2);
  environment.context.arc(1, 1, 1, 0, 2 * Math.PI, false);
  environment.context.restore();

  this._setColor(environment, object);
  environment.context.fill();
};

Hemp.prototype._renderText = function (environment, object) {
  this._setColor(environment, object);
  CanvasText.drawText(environment.context, object);
};

Hemp.prototype._setColor = function (environment, object) {
  if (environment.options.selectionRender) {
    environment.context.fillStyle = 'black';
  } else {
    environment.context.fillStyle = object.color;
  }
};

module.exports = Hemp;
