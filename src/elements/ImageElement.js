import Element from './Element.js';

/**
 * Image Element
 */

function ImageElement() {
  Element.call(this);
}

ImageElement.prototype = Object.create(Element.prototype);
ImageElement.prototype.constructor = ImageElement;

/************************************************************************************/

ImageElement.prototype.renderElement = function(object) {
  //var sourceAndOffset = Utilities.getFillSourceAndOffset(object.image, object);
  //this.context.drawImage(object.image, sourceAndOffset.offset.x, sourceAndOffset.offset.y, sourceAndOffset.source.width, sourceAndOffset.source.height, 0, 0, object.width, object.height);
};

export default ImageElement;