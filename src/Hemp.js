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
  
  if (typeof selector !== 'undefined') {
    this._element = this._findElement(selector);
  }

  if (this._interactive) {
    window.addEventListener('keydown', this._onKeyDown.bind(this));
    window.addEventListener('mousedown', this._onWindowMouseDown.bind(this));
    window.addEventListener('mousemove', this._onMouseMove.bind(this));
    window.addEventListener('mouseup', this._onMouseUp.bind(this));
  }

  this.setSize(width, height);
  
  this.setObjects(objects);

}
Hemp.prototype.constructor = Hemp;

// -----------------------------------------------------------------------------

Hemp.prototype.getEnvironment = function() {
  return this._environment;
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

Hemp.prototype.toImage = function(callback) {
	var image = new Image();
	image.onload = function() {
  	callback(image);
	}
	image.src = this._environment.canvas.toDataURL("image/png");
}

Hemp.prototype.setObjects = function(objects, callback) {
  objects = (objects && Array.isArray(objects)) ? objects : [];
  
  // deselect any existing objects, then update the internal list of objects
  this._deselectAllObjects();
  this._objects = this._cleanObjects(objects);
  
  this._objects.forEach(function(object, index) {
    object._index = index;
  });
  
  // create an array of promises for all image objects
  var promises = this._getImagePromises(this._objects);

  // once all images are loaded, set the internal list of objects and render
  Promise.all(promises).then(function(images) {
    this.render();
    if (typeof callback === 'function') {
      callback();
    }
  }.bind(this), function(reason) {
    console.error(reason);
  });
};

Hemp.prototype._getImagePromises = function(objects) {
  return objects.filter(function(object) {
    return object.type === 'image';
  }).map(function(object) {
    return new Promise(function(resolve, reject) {
      var image = Hemp.ImageCache.get(object.url);
      if (image) {
        this._createPrivateProperty(object, '_image', image);
        resolve();
      } else {
        this._createPrivateProperty(object, '_image', new Image());
        object._image.setAttribute('crossOrigin', 'anonymous');
        object._image.onload = function() {
          Hemp.ImageCache.set(object.url, object._image);
          resolve();
        };
        object._image.onerror = function(reason) {
          resolve();
        };
        object._image.src = object.url;
      }
    }.bind(this));
  }.bind(this));
};

Hemp.prototype.getObjects = function() {
  return this._cleanObjects(this._objects).map(function(object) {
    delete object._index;
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
    this._selectObject(this._objects[object._index], true);
  }
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
  var selectedObjects = this._getObjects({name: '_selected', value: true, op: 'eq'});
  var offset = event.altKey ? 10 : 1;
  switch (event.code) {
    case 'Escape':
      this._deselectAllObjects();
      break;
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
    default:
      console.log('_onKeyDown event.code:', event.code);
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
  var coordinates = Hemp.windowToCanvas(this._environment, event);
  var hitObjects = this._findObjectsAt(coordinates.x, coordinates.y);

  event.preventDefault();

  // if there's already a selected object, transform it if possible
  if (this._setupTransformingObject(coordinates.x, coordinates.y, event, hitObjects)) {
    return;
  }

  // deselect any selected objects
  this._deselectAllObjects();

  // if we hit an object, select it and start transforming it if possible
  if (hitObjects.length > 0) {
    this._selectObject(hitObjects[hitObjects.length - 1]);
    this._setupTransformingObject(coordinates.x, coordinates.y, event);
  }
  return;
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
  // if we're in the middle of a transform, update the selected object and render the canvas
  if (this._transformingObject && this._transformingObject.locked !== true) {
    var coordinates = Hemp.windowToCanvas(this._environment, event);
    TransformElement.transformMove(this._environment, this._transformingObject, coordinates.x, coordinates.y, event);
    this._renderObjects(this._environment);
    this._reportObjectTransform(this._transformingObject);
  }
};

Hemp.prototype._onMouseUp = function(event) {
  event.preventDefault();
  if (this._transformingObject && this._transformingObject.locked !== true) {
    TransformElement.transformEnd(this._environment, this._transformingObject, event);
    this._reportObjectTransform(this._transformingObject);
    this._transformingObject = null;
  }
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
  this._renderObject(environment, transformObject);
}

Hemp.prototype._createPrivateProperty = function(object, property, value) {
  Object.defineProperty(object, property, {enumerable: false, configurable: true, writable: true, value: value})
};

Hemp.prototype._renderObject = function(environment, object) {
  if (!object._element) {
    this._createPrivateProperty(object, '_element', ElementFactory.getElement(object));
  }
  var options = {};
  object._element.render(environment, object, options);
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

Hemp.ImageCache = {
  _images: {},
  _maxAgeMs: 300000,
  get: function(key) {
    this._age();
    var entry = this._images[key];
    if (entry) {
      entry.hitMs = Date.now();
      return entry.image;
    }
  },
  set: function(key, image) {
    this._images[key] = {
      hitMs: Date.now(),
      image: image
    };
    this._age();
  },
  _age: function() {
    var cutoffMs = Date.now() - this._maxAgeMs;
    Object.keys(this._images).forEach(function(key) {
      if (this._images[key].hitMs < cutoffMs) {
        delete this._images[key];
      }
    }.bind(this));
  }
};

export default Hemp;