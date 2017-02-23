/**
 * Hemp
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

import ElementFactory from './elements/ElementFactory.js';
import TransformElement from './elements/TransformElement.js';

var Hemp = function(width, height, objects, interactive, selector) {
  this._width = width;
  this._height = height;
  this._objects = objects ? objects : [];
  this._interactive = (typeof interactive !== 'undefined') ? interactive : false;

  if (typeof selector !== 'undefined') {
    this._element = this._findElement(selector);
  }

  this._environment = this._setupRenderEnvironment({
    width: this._width,
    height: this._height
  });

  this._element.append(this._environment.canvas);

  if (this._interactive) {
    this._environment.canvas.addEventListener('mousedown', this._onMouseDown.bind(this));
    this._environment.canvas.addEventListener('mousemove', this._onMouseMove.bind(this));
    this._environment.canvas.addEventListener('mouseup', this._onMouseUp.bind(this));
    this._setupObserver();
    this._handleElementResize();
  }

  this._renderObjects(this._environment);

}
Hemp.prototype.constructor = Hemp;

Hemp.prototype.getEnvironment = function() {
  return this._environment;
};

Hemp.prototype.getObjects = function() {
  return this._objects;
};

Hemp.prototype._createCanvas = function(width, height) {
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
};

Hemp.prototype._setupContext = function(canvas) {
  return canvas.getContext('2d');
};

Hemp.prototype._setupObserver = function() {
  var observer = new MutationObserver(function(mutations) {
    this._handleElementResize();
  }.bind(this));
  observer.observe(this._element, {
    attributes: true, childList: true, characterData: true
  });
};

Hemp.prototype._handleElementResize = function() {
  var rect = this._environment.canvas.getBoundingClientRect();
  this._windowToCanvas = function(x, y) {
    return {
      x: x * (this._width / rect.width),
      y: y * (this._height / rect.height)
    }
  };
};

Hemp.prototype._findElement = function(selector) {
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

Hemp.prototype._onMouseDown = function(event) {
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

Hemp.prototype._setupTransformingObject = function(mouseX, mouseY) {
  var selectedObjects = this._getObjects({name: 'selected', value: true, op: '=='});
  if (selectedObjects.length > 0) {
    var handle = TransformElement.findTransformHandle(this._environment, mouseX, mouseY, selectedObjects[0]);
    if (handle) {
      this._transformingObject = selectedObjects[0];
      TransformElement.transformBegin(this._environment, this._transformingObject, handle, mouseX, mouseY);
      return true;
    }
  }
  return false;
};

Hemp.prototype._onMouseMove = function(event) {
  // if we're in the middle of a transform, update the selected object and render the canvas
  if (this._transformingObject) {
    var coordinates = this._windowToCanvas(event.offsetX, event.offsetY);
    TransformElement.transformMove(this._environment, this._transformingObject, coordinates.x, coordinates.y, event);
    this._renderObjects(this._environment);
  }
};

Hemp.prototype._onMouseUp = function(event) {
  if (this._transformingObject) {
    TransformElement.transformEnd(this._environment, this._transformingObject);
    this._transformingObject = null;
  }
};

Hemp.prototype._deselectAllObjects = function() {
  var deselectedObjects = [];
  this._getObjects().forEach(function(object) {
    if (object.selected) {
      deselectedObjects.push(object);
    }
    object.selected = false;
  });
  this._renderObjects(this._environment);
  if (deselectedObjects.length > 0) {
    this._element.dispatchEvent(new CustomEvent('deselect', {detail: deselectedObjects}));
  }
};

Hemp.prototype._selectObject = function(object) {
  this._deselectAllObjects();
  object.selected = true;
  this._renderObjects(this._environment);
  this._element.dispatchEvent(new CustomEvent('select', {detail: object}));
};

Hemp.prototype._getObjects = function(filter) {
  if (Array.isArray(this._objects)) {
    if (filter) {
      return this._objects.filter(function(object) {
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

Hemp.prototype._findObjectsAt = function(x, y) {
  var results = [];
  if (!this._hitEnvironment) {
    this._hitEnvironment = this._setupRenderEnvironment({
      width: this._width,
      height: this._height
    }, {
      selectionRender: true
    });
  }
  this._getObjects().forEach(function(object) {
    this._clearEnvironment(this._hitEnvironment);
    this._renderObject(this._hitEnvironment, object);
    var hitboxSize = 10; // make this configurable
    var p = this._hitEnvironment.context.getImageData(x - (hitboxSize / 2), y - (hitboxSize / 2), hitboxSize, hitboxSize).data;
    for (var i = 0; i < p.length; i += 4) {
      if (p[i + 3] !== 0) { // looking only at alpha channel
        results.push(object);
        break;
      }
    }
  }.bind(this));
  return results;
};

Hemp.prototype._renderObjects = function(environment) {
  var selectedObject;
  this._clearEnvironment(environment);
  this._getObjects().forEach(function(object) {
    if (object.selected) {
      selectedObject = object;
    }
    this._renderObject(environment, object);
  }.bind(this));
  if (selectedObject) {
    this._renderTransformBoxForObject(environment, selectedObject);
  }
};

Hemp.prototype._renderTransformBoxForObject = function(environment, object) {
  environment.context.save();
  var transformObject = JSON.parse(JSON.stringify(object));
  transformObject.type = 'transform';
  var element = ElementFactory.getElement(environment, transformObject);
  element.render();
  environment.context.restore();
}

Hemp.prototype._renderObject = function(environment, object) {
  environment.context.save();
  var element = ElementFactory.getElement(environment, object);
  element.render();
  environment.context.restore();
};

Hemp.prototype._setupRenderEnvironment = function(object, options) {
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

Hemp.prototype._clearEnvironment = function(environment) {
  environment.context.clearRect(0, 0, environment.canvas.width, environment.canvas.height);
};

export default Hemp;