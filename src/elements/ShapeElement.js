import Element from './Element.js';

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

ShapeElement.prototype.renderElement = function(object) {
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

ShapeElement.prototype.renderRectangle = function(object) {
    this.context.save();
    this.context.fillStyle = object.color;
	this.context.fillRect(0, 0, object.width, object.height);
    this.context.restore();
};

ShapeElement.prototype.renderEllipse = function(object) {
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

export default ShapeElement;