/**
 * Hemp
 * Transform Element
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

import Element from './Element.js';

function TransformElement() {
  Element.call(this);
};

TransformElement.prototype = Object.create(Element.prototype);
TransformElement.prototype.constructor = TransformElement;

/************************************************************************************/

TransformElement.handleSize = 15;

TransformElement.prototype.render = function(environment, object) {
    this.renderCanvas(environment, object);
}

TransformElement.prototype.setupCanvas = function(environment, object) {
  // this special element uses the main context to draw
};

TransformElement.prototype.renderElement = function(environment, object) {
  // this special element uses the main context to draw
};

TransformElement.prototype.renderCanvas = function(environment, object) {
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
      environment.context.strokeStyle = 'rgba(0, 0, 0, 1.0)';
      type = 'stroke';
    } else {
      environment.context.lineWidth = 2 * environment.scaling.x;
      environment.context.setLineDash([6, 2]);
      environment.context.strokeStyle = 'rgba(255, 255, 0, 1.0)';
      environment.context.fillStyle = 'rgba(255, 255, 0, 1.0)';
      type = 'fill';
    }
      
    // body
    environment.context.strokeRect(-object.width / 2, -object.height / 2, object.width, object.height);
    
    if (object.locked !== true) {
      // ul
      TransformElement.fillOrStrokeRect(environment.context, -object.width / 2, -object.height / 2, handleSize, handleSize, type);
      // ur
      TransformElement.fillOrStrokeRect(environment.context, (object.width / 2) - handleSize, -object.height / 2, handleSize, handleSize, type);
      // lr
      TransformElement.fillOrStrokeRect(environment.context, (object.width / 2) - handleSize, (object.height / 2) - handleSize, handleSize, handleSize, type);
      // ll
      TransformElement.fillOrStrokeRect(environment.context, -object.width / 2, (object.height / 2) - handleSize, handleSize, handleSize, type);
    
      // top
      TransformElement.fillOrStrokeRect(environment.context, -handleSize / 2, -object.height / 2, handleSize, handleSize, type);
      // right
      TransformElement.fillOrStrokeRect(environment.context, (object.width / 2) - handleSize, -10, handleSize, handleSize, type);
      // bottom
      TransformElement.fillOrStrokeRect(environment.context, -handleSize / 2, (object.height / 2) - handleSize, handleSize, handleSize, type);
      // left
      TransformElement.fillOrStrokeRect(environment.context, -object.width / 2, -10, handleSize, handleSize, type);
    
      // rotate handle
      TransformElement.fillOrStrokeRect(environment.context, -handleSize / 2, -(object.height / 2) - (handleSize * 2), handleSize, handleSize, type);
      // rotate connector
      environment.context.strokeRect(0, -(object.height / 2) - handleSize, 1, handleSize);
    }
  }

  environment.context.restore();
};

TransformElement.fillOrStrokeRect = function(context, x, y, height, width, type) {
  switch (type) {
    case 'fill':
      context.fillRect(x, y, height, width);
      break;
    case 'stroke':
      context.strokeRect(x, y, height, width);
      break;
  }
  
};


TransformElement.findTransformHandle = function(environment, mouseX, mouseY, object) {
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
      case 'ul': // upper-left
        environment.context.rect(-handleX, -handleY, handleSize, handleSize);
        break;
      case 'ur': // upper-right
        environment.context.rect(handleX - handleSize, -handleY, handleSize, handleSize);
        break;
      case 'll': // upper-right
        environment.context.rect(-handleX, handleY - handleSize, handleSize, handleSize);
        break;
      case 'lr': // upper-right
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
        environment.context.rect(-handleSize / 2, -handleY - (handleSize * 2), handleSize, handleSize);
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

TransformElement.rotatePoint = function(radians, object, x, y) {
  return {
    x: object.x + (Math.cos(radians) * (x - object.x)) - (Math.sin(radians) * (y - object.y)),
    y: object.y + (Math.sin(radians) * (x - object.x)) + (Math.cos(radians) * (y - object.y))
  };
};

TransformElement.getCorners = function(object) {
  var left = object.x - (object.width / 2);
  var right = object.x + (object.width / 2);
  var top = object.y - (object.height / 2);
  var bottom = object.y + (object.height / 2);
  var corners = {
    top: top,
    left: left,
    bottom: bottom,
    right: right,
    center: object.x,
    middle: object.y,
    ul: {x: left, y: top},
    ur: {x: right, y: top},
    ll: {x: left, y: bottom},
    lr: {x: right, y: bottom}
  }
  return corners;
};

TransformElement.updateObjectFromCorners = function(object, corners, fromCenter) {
  var handle = object._transform.handle;
  var anchor = object._transform.anchor;
  var top = corners.top, left = corners.left, bottom = corners.bottom, right = corners.right;

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

TransformElement.transformBegin = function(environment, object, handle, mouseX, mouseY, event) {
  var anchor;

  if (!object._clicks) {
    Object.defineProperty(object, '_clicks', {enumerable: false, configurable: true, writable: true, value: {count: 0}})
  }

  clearTimeout(object._clicks.timeout);
  object._clicks.timeout = setTimeout(function() {
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
  
  Object.defineProperty(object, '_transform', {enumerable: false, configurable: true, writable: true})
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

TransformElement.snapObject = function(environment, object) {
  var corners = TransformElement.getCorners(object);
  // TODO: this doesn't work for rotated objects very well
  var sides = [
    {name: 'top', snap: 0, axis: 'y', derotate: true},
    {name: 'right', snap: environment.canvas.width, axis: 'x', derotate: true},
    {name: 'bottom', snap: environment.canvas.height, axis: 'y', derotate: true},
    {name: 'left', snap: 0, axis: 'x', derotate: true},
    {name: 'center', snap: environment.canvas.width / 2, axis: 'x', derotate: false},
    {name: 'middle', snap: environment.canvas.height / 2, axis: 'y', derotate: false},
  ];
  var snapped = false;
  var rotation = (typeof object.rotation !== 'undefined') ? object.rotation : 0;
  var snappedRotation = Math.floor(((rotation + 45) % 360) / 90) * 90;
  var axisSnapped = {};
  for (var i = 0; i < sides.length; i++) {
    var side = sides[i];
    if (axisSnapped[side.axis]) { // don't attempt to snap two things to an 'x' axis, for example
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

TransformElement.snapMaximize = function(environment, object, mouseX, mouseY) {
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
      delete object._transform.maximize
    }
  }
};

TransformElement.setObjectGeometry = function(src, dst, onlyLocation) {
  dst.x = src.x;
  dst.y = src.y;
  if (onlyLocation === true) {
    return;
  }
  dst.width = src.width;
  dst.height = src.height;
  dst.rotation = src.rotation;
};

TransformElement.snapToObject = function(object, hitObjects, event) {
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

TransformElement.transformMoveObject = function(environment, object, mouseX, mouseY, event, hitObjects) {
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

TransformElement.getObjectRotationInRadians = function(object) {
  var rotation = 0;
  if (typeof object.rotation !== 'undefined') {
    rotation = object.rotation;
  }
  return rotation * (Math.PI / 180);
};

TransformElement.transformRotateObject = function(environment, object, mouseX, mouseY, event) {
  var radians = TransformElement.getObjectRotationInRadians(object);

  // offset mouse so it will be relative to 0,0 (the object's new origin)
  mouseX -= object.x;
  mouseY -= object.y;

  // move the object to 0, 0
  object.x = 0;
  object.y = 0;

  // rotate the mouse around 0, 0 so it matches the object's rotation
  var mouse = TransformElement.rotatePoint(-radians, object, mouseX, mouseY);

  var theta = Math.atan2(mouseY, mouseX) * (180/Math.PI);
  if (theta < 0) theta = 360 + theta;
  theta = (theta + 90) % 360;
  if (event.altKey) {
    theta = Math.round(theta / 45) * 45;
  }
  object.rotation = theta;

  object.x = object._transform.origin.object.x;
  object.y = object._transform.origin.object.y;
};

TransformElement.transformResizeObject = function(environment, object, mouseX, mouseY, event) {
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
  corners[object._transform.handle] = {x: mouse.x, y: mouse.y};

  // rebuild the object from the modified corners
  TransformElement.updateObjectFromCorners(object, corners, event.shiftKey);
};

TransformElement.transformMove = function(environment, object, mouseX, mouseY, event, hitObjects) {
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

TransformElement.transformEnd = function(environment, object, event) {
  object.x = Math.floor(object.x);
  object.y = Math.floor(object.y);
  object.height = Math.floor(object.height);
  object.width = Math.floor(object.width);
  object.rotation = Math.floor(object.rotation);
  delete object._transform;
};

export default TransformElement;