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
  environment.context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  
  // body
  environment.context.strokeRect(-object.width / 2, -object.height / 2, object.width, object.height);
  // ul
  environment.context.strokeRect(-object.width / 2, -object.height / 2, TransformElement.handleSize, TransformElement.handleSize);
  // ur
  environment.context.strokeRect((object.width / 2) - TransformElement.handleSize, -object.height / 2, TransformElement.handleSize, TransformElement.handleSize);
  // lr
  environment.context.strokeRect((object.width / 2) - TransformElement.handleSize, (object.height / 2) - TransformElement.handleSize, TransformElement.handleSize, TransformElement.handleSize);
  // ll
  environment.context.strokeRect(-object.width / 2, (object.height / 2) - TransformElement.handleSize, TransformElement.handleSize, TransformElement.handleSize);
  // rotate handle
  environment.context.strokeRect(-10, -(object.height / 2) - (TransformElement.handleSize * 2), TransformElement.handleSize, TransformElement.handleSize);
  // rotate connector
  environment.context.strokeRect(0, -(object.height / 2) - TransformElement.handleSize, 1, TransformElement.handleSize);

  environment.context.restore();
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
  var handle = object.transform.handle;
  var anchor = object.transform.anchor;
  var top, left, bottom, right;

  // position the TRBL based on the handle and anchor
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
    object.x = object.transform.origin.object.x;
    object.y = object.transform.origin.object.y;
  } else {
    // if we're resizing from an anchor corner, still have work to do
    
    // figure out the offsets for the object centerpoint based on the new W & H vs the old
    var offsetX = (object.width - object.transform.resize.origin.width) / 2;
    var offsetY = (object.height - object.transform.resize.origin.height) / 2;
  
    var radians = TransformElement.getObjectRotationInRadians(object);

    // for each handle type, we have to calculate the centerpoint slightly differently    
    switch (handle) {
      case 'ul':
        var offset = TransformElement.rotatePoint(radians, object, offsetX, offsetY);
        object.x = object.transform.resize.origin.x - offset.x;
        object.y = object.transform.resize.origin.y - offset.y;
        break;
      case 'ur':
        var offset = TransformElement.rotatePoint(-radians, object, offsetX, offsetY);
        object.x = object.transform.resize.origin.x + offset.x;
        object.y = object.transform.resize.origin.y - offset.y;
        break;
      case 'lr':
        var offset = TransformElement.rotatePoint(radians, object, offsetX, offsetY);
        object.x = object.transform.resize.origin.x + offset.x;
        object.y = object.transform.resize.origin.y + offset.y;
        break;
      case 'll':
        var offset = TransformElement.rotatePoint(-radians, object, offsetX, offsetY);
        object.x = object.transform.resize.origin.x - offset.x;
        object.y = object.transform.resize.origin.y + offset.y;
        break;
    }
  }
  
};

TransformElement.transformBegin = function(environment, object, handle, mouseX, mouseY, begin) {
  var anchor;

  if (!object.clicks) {
    object.clicks = {
      count: 0
    };
  }

  clearTimeout(object.clicks.timeout);
  object.clicks.timeout = setTimeout(function() {
    object.clicks.count = 0;
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
    case 'body':
      object.clicks.count++;
      break;
  }
  
  object.transform = {
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

  return object.clicks.count;

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
    object.rotation = object.transform.origin.object.rotation;
  }
};

TransformElement.transformMoveObject = function(environment, object, mouseX, mouseY, event) {
  var deltaX = mouseX - object.transform.origin.mouse.x;
  var deltaY = mouseY - object.transform.origin.mouse.y;
  object.x = object.transform.origin.object.x + deltaX;
  object.y = object.transform.origin.object.y + deltaY;

  var rotation = (typeof object.rotation !== 'undefined') ? object.rotation : 0;
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

  object.x = object.transform.origin.object.x;
  object.y = object.transform.origin.object.y;
};

TransformElement.transformResizeObject = function(environment, object, mouseX, mouseY, event) {
  var radians = TransformElement.getObjectRotationInRadians(object);

  // offset mouse so it will be relative to 0,0 (the object's new origin)
  mouseX -= object.x;
  mouseY -= object.y;

  // move the object to 0, 0

  object.transform.resize = {
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
  corners[object.transform.handle] = {x: mouse.x, y: mouse.y};

  // rebuild the object from the modified corners
  TransformElement.updateObjectFromCorners(object, corners, event.shiftKey);
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

TransformElement.transformEnd = function(environment, object, event) {
  delete object.transform;
};

export default TransformElement;