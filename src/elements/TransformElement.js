/**
 * Hemp
 * Transform Element
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

import Element from './Element.js';

function TransformElement(environment, object) {
  Element.call(this, environment, object);
};

TransformElement.prototype = Object.create(Element.prototype);
TransformElement.prototype.constructor = TransformElement;

/************************************************************************************/

TransformElement.prototype.renderElement = function() {
  this._environment.context.translate(this._object.x, this._object.y);
  if (typeof this._object.rotation !== 'undefined') {
    this._environment.context.rotate(this._object.rotation * Math.PI / 180);
  }
  this._environment.context.lineWidth = 4;
  this._environment.context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  // body
  this._environment.context.strokeRect(-this._object.width / 2, -this._object.height / 2, this._object.width, this._object.height);
  // ul
  this._environment.context.strokeRect(-this._object.width / 2, -this._object.height / 2, 20, 20);
  // ur
  this._environment.context.strokeRect((this._object.width / 2) - 20, -this._object.height / 2, 20, 20);
  // lr
  this._environment.context.strokeRect((this._object.width / 2) - 20, (this._object.height / 2) - 20, 20, 20);
  // ll
  this._environment.context.strokeRect(-this._object.width / 2, (this._object.height / 2) - 20, 20, 20);
  // rotate handle
  this._environment.context.strokeRect(-10, -(this._object.height / 2) - 40, 20, 20);
  // rotate connector
  this._environment.context.strokeRect(0, -(this._object.height / 2) - 20, 1, 20);
};

TransformElement.findTransformHandle = function(environment, mouseX, mouseY, object) {
  var handles = ['ul', 'ur', 'll', 'lr', 'body', 'rotate'];
  for (var i = 0; i < handles.length; i++) {
    var handle = handles[i];

    environment.context.save();

    environment.context.translate(object.x, object.y);

    var radians = TransformElement.getObjectRotationInRadians(object);
    environment.context.rotate(radians);

    environment.context.beginPath();
    var handleSize = 20; // TODO: make this configurable
    var handleX = object.width / 2 - (handleSize);
    var handleY = object.height / 2 - (handleSize );
    switch (handle) {
      case 'ul': // upper-left
        environment.context.arc(-handleX, -handleY, handleSize, 0, 2 * Math.PI, false);
        break;
      case 'ur': // upper-right
        environment.context.arc(handleX, -handleY, handleSize, 0, 2 * Math.PI, false);
        break;
      case 'll': // upper-right
        environment.context.arc(-handleX, handleY, handleSize, 0, 2 * Math.PI, false);
        break;
      case 'lr': // upper-right
        environment.context.arc(handleX, handleY, handleSize, 0, 2 * Math.PI, false);
        break;
      case 'rotate':
        environment.context.arc(0, -handleY - (handleSize * 2), handleSize, 0, 2 * Math.PI, false);
        break;
      case 'body':
        environment.context.rect(-object.width / 2, -object.height / 2, object.width, object.height);
        break;
    }
    //environment.context.fill();
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

TransformElement.getCorners = function(radians, object) {
  var left = object.x - (object.width / 2);
  var right = object.x + (object.width / 2);
  var top = object.y - (object.height / 2);
  var bottom = object.y + (object.height / 2);
  var corners = {
    top: top,
    left: left,
    bottom: bottom,
    right: right,
    ul: {x: left, y: top},
    ur: {x: right, y: top},
    ll: {x: left, y: bottom},
    lr: {x: right, y: bottom}
  }
  return corners;
};


TransformElement.updateObjectFromCorners = function(object, corners) {
  var handle = object.transform.handle;
  var anchor = object.transform.anchor;
  var top, left, bottom, right;
  
  switch (handle) {
    case 'ul':
      top = corners[handle].y;
      left = corners[handle].x;
      bottom = corners[anchor].y;
      right = corners[anchor].x;
      break;
    case 'lr':
      top = corners[anchor].y;
      left = corners[anchor].x;
      bottom = corners[handle].y;
      right = corners[handle].x;
      break;
    case 'ur':
      top = corners[handle].y;
      left = corners[anchor].x;
      bottom = corners[anchor].y;
      right = corners[handle].x;
      break;
    case 'll':
      top = corners[anchor].y;
      left = corners[handle].x;
      bottom = corners[handle].y;
      right = corners[anchor].x;
      break;
  }

  object.width = right - left;
  object.height = bottom - top;

  object.x = object.transform.origin.object.x;
  object.y = object.transform.origin.object.y;
};

TransformElement.transformBegin = function(environment, object, handle, mouseX, mouseY) {
  var anchor;
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
  }
  object.transform = {
    handle: handle,
    anchor: anchor,
    origin: {
      object: {
        x: object.x,
        y: object.y
      },
      mouse: {
        x: mouseX,
        y: mouseY
      }
    }
  };
};

TransformElement.offsetCorners = function(corners, offsetX, offsetY) {
  var top = corners.top + offsetY;
  var left = corners.left + offsetX;
  var bottom = corners.bottom + offsetY;
  var right = corners.right + offsetX;
  var corners = {
    top: top,
    left: left,
    bottom: bottom,
    right: right,
    ul: {x: left, y: top},
    ur: {x: right, y: top},
    ll: {x: left, y: bottom},
    lr: {x: right, y: bottom}
  }
  return corners;
};

TransformElement.transformMoveObject = function(environment, object, mouseX, mouseY, event) {
  if (event.shiftKey) {
    mouseX = Math.round(mouseX / 100) * 100;
    mouseY = Math.round(mouseY / 100) * 100;
  }
  object.x = mouseX;
  object.y = mouseY;
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
  if (event.shiftKey) {
    theta = Math.round(theta / 45) * 45;
  }
  object.rotation = theta;

  object.x = object.transform.origin.object.x;
  object.y = object.transform.origin.object.y;
};

TransformElement.transformResizeObject = function(environment, object, mouseX, mouseY, event) {
  var radians = TransformElement.getObjectRotationInRadians(object);

  // offset mouse so it will be relative to 0,0 (the object's new origin)
  mouseX -= object.x;
  mouseY -= object.y;

  // move the object to 0, 0
  object.x = 0;
  object.y = 0;

  // rotate the mouse around 0, 0 so it matches the object's rotation
  var mouse = TransformElement.rotatePoint(-radians, object, mouseX, mouseY);

  // find all the corners of the unrotated object
  var corners = TransformElement.getCorners(0, object);
  
  // move the handle to match the rotated mouse coordinates
  corners[object.transform.handle] = {x: mouse.x, y: mouse.y};

  // rebuild the object from the modified corners
  TransformElement.updateObjectFromCorners(object, corners);
};

TransformElement.transformMove = function(environment, object, mouseX, mouseY, event) {
  switch (object.transform.handle) {
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

TransformElement.transformEnd = function(environment, object) {
  delete object.transform;
};

export default TransformElement;