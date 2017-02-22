/**
 * Base Element object
 */

function Element() {
};

/************************************************************************************/

Element.prototype.render = function(context, object) {
	this.setupCanvas(object);
	this.renderElement(object);
	this.renderCanvas(context, object);
};

Element.prototype.setupCanvas = function(object) {
	this.canvas = document.createElement('canvas');
	this.context = this.canvas.getContext('2d');
	this.canvas.width = object.width;
	this.canvas.height = object.height;
	if (object.backgroundColor) {
		this.context.save();
		this.context.fillStyle = object.backgroundColor;
		this.context.fillRect(0, 0, object.width, object.height);
		this.context.restore();
	}
};

Element.prototype.renderElement = function(object) {
	console.warn('override me');
};

Element.prototype.renderCanvas = function(context, object) {
	context.save();
	context.translate(object.x, object.y);
	if (object.rotation) {
		context.rotate(object.rotation * Math.PI / 180);
	}
	if (typeof object.opacity !== 'undefined') {
		context.globalAlpha = object.opacity;
	}
	context.drawImage(this.canvas, -object.width / 2, -object.height / 2);
	context.restore();
};



export default Element;