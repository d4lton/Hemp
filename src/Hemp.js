/**
 * Hemp
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

import ElementFactory from './elements/ElementFactory.js';
import TransformElement from './elements/TransformElement.js';

// -----------------------------------------------------------------------------

var Hemp = function(width, height, objects, interactive, selector) {
  this._interactive = (typeof interactive !== 'undefined') ? interactive : false;
  
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

}
Hemp.prototype.constructor = Hemp;
Hemp.ElementFactory = ElementFactory;

// -----------------------------------------------------------------------------

Hemp.nextId = 0;

Hemp.prototype.getEnvironment = function() {
  return this._environment;
};

Hemp.prototype.setMediaReflectorUrl = function(url) {
  this._mediaReflectorUrl = url
};

Hemp.prototype.setSize = function(width, height) {
  this._width = width;
  this._height = height;

  // remove the existing mousedown listener, if any
  if (this._environment) {
    if (this._element) {
      this._element.removeChild(this._environment.canvas);
    }
    if (this._interactive) {
      this._environment.canvas.removeEventListener('mousedown', this._onMouseDown.bind(this));
      this._environment.canvas.removeEventListener('contextmenu', this._onMouseDown.bind(this));
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
    this._environment.canvas.addEventListener('contextmenu', this._onMouseDown.bind(this));
  }

};

Hemp.prototype.destroy = function() {
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

Hemp.prototype.toImage = function(callback) {
	var image = new Image();
	image.onload = function() {
  	callback(image);
	}
	image.src = this._environment.canvas.toDataURL("image/png");
}

Hemp.prototype.setObjects = function(objects, callback) {
  objects = (objects && Array.isArray(objects)) ? objects : [];
  
  this._addUpdateObjects(objects);

  var promises = [];  
  var now = Date.now();
  this._objects.forEach(function(object, index) {
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
    if (this._interactive) {
      // if interactive, run promises in parallel to not block render
      promises.forEach(function(promise) {
        promise.then(function() {
          this._finishLoading(callback);
        }.bind(this), function() {
          this._finishLoading(callback);
        }.bind(this));
      }.bind(this));
      
    } else {
      // if not interactive, run all promises in serial, blocking render until done
      Promise.all(promises).then(function() {
        this._finishLoading(callback);
      }.bind(this), function() {
        this._finishLoading(callback);
      }.bind(this));

    }
  } else {
    this._finishLoading(callback);
  }
};

Hemp.prototype._generateInternalId = function(ms, object) {
  if (!object._internalId) {
    var id = ms + '_' + Hemp.nextId++;
    object._internalId = id;
  }
};

Hemp.prototype._getObjectByInternalId = function(id) {
  for (var i = 0; i < this._objects.length; i++) {
    if (this._objects[i]._internalId === id) {
      return this._objects[i];
    }
  }
};

Hemp.prototype._copyPublicProperties = function(src, dst) {
  Object.keys(src).forEach(function(id) {
    if (id.substr(0, 1) !== '_') {
      console.log('setting', id);
      dst[id] = src[id];
    }
  });
};

Hemp.prototype._addUpdateObjects = function(objects) {
  if (!this._objects) {
    this._objects = [];
  }

  this._objects = this._objects.concat(objects);

  for (var i = 0; i < this._objects.length; i++) {
    var found = false;
    for (var j = i + 1; j < this._objects.length; j++) {
      if (this._objects[i]._internalId && (this._objects[i]._internalId === this._objects[j]._internalId)) {
        this._copyPublicProperties(this._objects[j], this._objects[i]);
        this._objects.splice(j, 1);
        found = true;
        break;
      }
    }
    if (!found && this._objects[i]._internalId) {
      this._objects.splice(i, 1);
    }
  }
};

Hemp.prototype._finishLoading = function(callback) {
  this.render();
  if (typeof callback === 'function') {
    callback(this._objects);
  }
};

Hemp.prototype.getObjects = function() {
  return this._cleanObjects(this._objects).map(function(object) {
    return object;
  });
};

Hemp.prototype.getElement = function() {
  return this._element;
};

Hemp.prototype.render = function() {
  if (this._environment) {
    this._renderObjects(this._environment);
  }
};

Hemp.prototype.setStickyTransform = function(value) {
  if (typeof value !== 'undefined') {
    this._stickyTransform = value;
  }
};

Hemp.prototype.select = function(object) {
  this._deselectAllObjects(true);
  if (typeof object !== 'undefined') {
    this._selectObject(this._getObjectByInternalId(object._internalId), true);
  }
};

Hemp.prototype.deselect = function(object) {
  this._deselectAllObjects(true);
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

Hemp.prototype._onKeyDown = function(event) {
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

Hemp.prototype._onKeyUp = function(event) {
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

Hemp.prototype._nudgeObject = function(object, offsetX, offsetY, event) {
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

Hemp.prototype._onMouseDown = function(event) {
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
      this._deselectAllObjects();
      this._selectObject(hitObject);
    }
    this._setupTransformingObject(coordinates.x, coordinates.y, event);
  }
  return false;
};

Hemp.prototype._onWindowMouseDown = function(event) {
  var coordinates = Hemp.windowToCanvas(this._environment, event);
  if (coordinates.x < 0 ||
      coordinates.y < 0 ||
      coordinates.x > this._environment.canvas.width ||
      coordinates.y > this._environment.canvas.height) {
    this._deselectAllObjects();
  }
};

Hemp.prototype._maximizeObject = function(object) {
  object.x = this._environment.canvas.width / 2;
  object.y = this._environment.canvas.height / 2;
  object.width = this._environment.canvas.width;
  object.height = this._environment.canvas.height;
  object.rotation = 0;
  this._renderObjects(this._environment);
};

Hemp.prototype._setupTransformingObject = function(mouseX, mouseY, event, hitObjects) {
  var selectedObjects = this._getObjects({name: '_selected', value: true, op: 'eq'});
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

Hemp.prototype._reportObjectTransform = function(object) {
  if (this._element) {
    this._element.dispatchEvent(new CustomEvent('transform', {detail: this._cleanObject(object)}));
  }
};

Hemp.prototype._onMouseMove = function(event) {
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

Hemp.prototype._onMouseUp = function(event) {
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

Hemp.prototype._deselectAllObjects = function(skipEvent) {
  var deselectedObjects = [];
  this._getObjects().forEach(function(object) {
    if (object._selected) {
      deselectedObjects.push(object);
    }
    delete object._selected;
  });
  this._renderObjects(this._environment);
  if (deselectedObjects.length > 0) {
    if (this._element && skipEvent !== true) {
      console.trace('deselect');
      this._element.dispatchEvent(new CustomEvent('deselect', {detail: this._cleanObjects(deselectedObjects)}));
    }
  }
};

Hemp.prototype._selectObject = function(object, skipEvent) {
  this._deselectAllObjects(skipEvent);
  this._createPrivateProperty(object, '_selected', true);
  this._renderObjects(this._environment);
  if (this._element && skipEvent !== true) {
    this._element.dispatchEvent(new CustomEvent('select', {detail: this._cleanObject(object)}));
  }
};

Hemp.prototype._getObjects = function(filter) {
  if (Array.isArray(this._objects)) {
    if (filter) {
      return this._objects.filter(function(object) {
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

Hemp.prototype._clearFindObjectsAt = function() {
  this._getObjects().forEach(function(object) {
    if (object._hitEnvironment) {
      delete object._hitEnvironment;
    }
  }.bind(this));
};

Hemp.prototype._findObjectsAt = function(x, y) {
  var results = [];
  this._getObjects().forEach(function(object) {

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
    var p = object._hitEnvironment.context.getImageData(x - (hitboxSize / 2), y - (hitboxSize / 2), hitboxSize, hitboxSize).data;
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
    if (this._interactive && object._selected) {
      selectedObject = object;
    }
    this._renderObject(environment, object);
  }.bind(this));
  if (selectedObject) {
    this._renderTransformBoxForObject(environment, selectedObject);
  }
};

Hemp.prototype._cleanObjects = function(objects) {
  return objects.map(function(object) {
    return this._cleanObject(object);
  }.bind(this));
}

Hemp.prototype._cleanObject = function(object) {
  return JSON.parse(JSON.stringify(object));
};

Hemp.prototype._renderTransformBoxForObject = function(environment, object) {
  var transformObject = this._cleanObject(object);
  transformObject.type = 'transform';
  this._createPrivateProperty(transformObject, '_element', ElementFactory.getElement(transformObject));
  this._renderObject(environment, transformObject);
}

Hemp.prototype._createPrivateProperty = function(object, property, value) {
  Object.defineProperty(object, property, {enumerable: false, configurable: true, writable: true, value: value})
};

Hemp.prototype._renderObject = function(environment, object) {
  object._element.render(environment, object, {});
};

Hemp.prototype._setupRenderEnvironment = function(object, options) {
  var canvas = this._createCanvas(object.width, object.height);
  var context = this._setupContext(canvas);
  return {
    options: options ? options : {},
    canvas: canvas,
    context: context
  };
};

Hemp.prototype._clearEnvironment = function(environment) {
  environment.context.clearRect(0, 0, environment.canvas.width, environment.canvas.height);
};

// -----------------------------------------------------------------------------

Hemp.windowToCanvas = function(environment, event) {
  var x = event.clientX;
  var y = event.clientY;
  var rect = {left: 0, top: 0, width: 1, height: 1};
  if (environment) {
    rect = environment.canvas.getBoundingClientRect();
  }
  return {
    x: (x - rect.left) * (environment.canvas.width / rect.width),
    y: (y - rect.top) * (environment.canvas.height / rect.height)
  }
};

export default Hemp;
