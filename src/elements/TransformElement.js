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

TransformElement.handleSize = 20;

TransformElement.prototype.setupCanvas = function(environment, object) {
  // this special element uses the main context to draw
};

TransformElement.prototype.renderElement = function(environment, object) {
  // this special element uses the main context to draw
};

TransformElement.prototype.renderCanvas = function(environment, object) {
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
    environment.context.strokeRect((object.width / 2) - TransformElement.handleSize, -object.height / 2, TransformElement.handleSize, TransformElement.handleSize);
    // lr
    environment.context.strokeRect((object.width / 2) - TransformElement.handleSize, (object.height / 2) - TransformElement.handleSize, TransformElement.handleSize, TransformElement.handleSize);
    // ll
    environment.context.strokeRect(-object.width / 2, (object.height / 2) - TransformElement.handleSize, TransformElement.handleSize, TransformElement.handleSize);
  
    // top
    environment.context.strokeRect(-10, -object.height / 2, TransformElement.handleSize, TransformElement.handleSize);
    // right
    environment.context.strokeRect((object.width / 2) - TransformElement.handleSize, -10, TransformElement.handleSize, TransformElement.handleSize);
    // bottom
    environment.context.strokeRect(-10, (object.height / 2) - TransformElement.handleSize, TransformElement.handleSize, TransformElement.handleSize);
    // left
    environment.context.strokeRect(-object.width / 2, -10, TransformElement.handleSize, TransformElement.handleSize);
  
    // rotate handle
    environment.context.strokeRect(-10, -(object.height / 2) - (TransformElement.handleSize * 2), TransformElement.handleSize, TransformElement.handleSize);
    // rotate connector
    environment.context.strokeRect(0, -(object.height / 2) - TransformElement.handleSize, 1, TransformElement.handleSize);
  }

  environment.context.restore();
};


TransformElement.findTransformHandle = function(environment, mouseX, mouseY, object) {
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
      case 'ul': // upper-left
        environment.context.rect(-handleX, -handleY, TransformElement.handleSize, TransformElement.handleSize);
        break;
      case 'ur': // upper-right
        environment.context.rect(handleX - TransformElement.handleSize, -handleY, TransformElement.handleSize, TransformElement.handleSize);
        break;
      case 'll': // upper-right
        environment.context.rect(-handleX, handleY - TransformElement.handleSize, TransformElement.handleSize, TransformElement.handleSize);
        break;
      case 'lr': // upper-right
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

TransformElement.transformBegin = function(environment, object, handle, mouseX, mouseY, begin) {
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
  var canDerotate = (rotation < 20 || rotation > 340); // maybe allow near-90 degree values?
  var axisSnapped = {};
  for (var i = 0; i < sides.length; i++) {
    var side = sides[i];
    if (axisSnapped[side.axis]) { // don't attempt to snap two things to an 'x' axis, for example
      continue;
    }
    if (!side.derotate || (side.derotate && canDerotate)) {
      var delta = side.snap - corners[side.name];
      if (Math.abs(delta) < 20) {
        axisSnapped[side.axis] = true;
        snapped = true;
        if (side.derotate) {
          object.rotation = 0;
        }
        object[side.axis] += delta;
      }
    }
  }
  if (!snapped) {
    object.rotation = object._transform.origin.object.rotation;
  }
};

TransformElement.snapMaximize = function(environment, object, mouseX, mouseY) {
  if (mouseY < 0) {
    if (!object._transform.maximizing) {
      object._transform.maximizing = true;
      object._transform.maximize = {
        width: object.width,
        height: object.height,
        x: object.x,
        y: object.y,
        rotation: object.rotation
      }
      object.x = environment.canvas.width / 2;
      object.y = environment.canvas.height / 2;
      object.width = environment.canvas.width;
      object.height = environment.canvas.height;
      object.rotation = 0;
    }
  } else {
    if (object._transform.maximizing) {
      object._transform.maximizing = false;
      object.width = object._transform.maximize.width;
      object.height = object._transform.maximize.height;
      object.x = object._transform.maximize.x;
      object.y = object._transform.maximize.y;
      object.rotation = object._transform.maximize.rotation;
      delete object._transform.maximize
    }
  }

};

TransformElement.transformMoveObject = function(environment, object, mouseX, mouseY, event) {
  var deltaX = mouseX - object._transform.origin.mouse.x;
  var deltaY = mouseY - object._transform.origin.mouse.y;
  
  if (!object._transform.maximizing) {
    object.x = object._transform.origin.object.x + deltaX;
    object.y = object._transform.origin.object.y + deltaY;
  }
  
  TransformElement.snapMaximize(environment, object, mouseX, mouseY);

  if (event.altKey) {
    TransformElement.snapObject(environment, object);
  }

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

TransformElement.transformMove = function(environment, object, mouseX, mouseY, event) {
  switch (object._transform.handle) {
    case 'body':
      TransformElement.transformMoveObject(environment, object, mouseX, mouseY, event);
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
  delete object._transform;
};

export default TransformElement;