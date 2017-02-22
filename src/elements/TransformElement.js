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
  this._environment.context.rotate(this._object.rotation * Math.PI / 180);
  this._environment.context.lineWidth = 8;
  this._environment.context.strokeStyle = 'rgba(0, 0, 0, 0.5)';
  this._environment.context.strokeRect(-this._object.width / 2, -this._object.height / 2, this._object.width, this._object.height);
  this._environment.context.strokeRect(-this._object.width / 2, -this._object.height / 2, 20, 20);
  this._environment.context.strokeRect((this._object.width / 2) - 20, -this._object.height / 2, 20, 20);
  this._environment.context.strokeRect((this._object.width / 2) - 20, (this._object.height / 2) - 20, 20, 20);
  this._environment.context.strokeRect(-this._object.width / 2, (this._object.height / 2) - 20, 20, 20);
};

TransformElement.findTransformHandle = function(environment, mouseX, mouseY, object) {
  var handles = ['ul', 'ur', 'll', 'lr', 'body'];
  for (var i = 0; i < handles.length; i++) {
    var handle = handles[i];

    environment.context.save();
    environment.context.translate(object.x, object.y);
    environment.context.rotate(object.rotation * Math.PI / 180);

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
      case 'body':
        environment.context.rect(-object.width / 2, -object.height / 2, object.width, object.height);
        break;
    }
    //this._environment.context.fill();
    var hit = environment.context.isPointInPath(mouseX, mouseY);
    environment.context.restore();
    if (hit) {
      return handle;
    }
  }
};

TransformElement.transformObject = function(mouseX, mouseY, object, handle) {
  var radians = -object.rotation * Math.PI / 180;
  // get the current top-left and bottom-right coordinates of the bounding rect
  var x1 = object.x - (object.width / 2);
  var y1 = object.y - (object.height / 2);
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

export default TransformElement;