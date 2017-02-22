import ImageElement from './ImageElement.js';
import TextElement from './TextElement.js';
import ShapeElement from './ShapeElement.js';

var ElementFactory = {};

ElementFactory.getElement = function(type) {
	var element;
	switch (type) {
		case 'image':
			element = new ImageElement();
			break;
		case 'text':
			element = new TextElement();
			break;
		case 'rectangle':
		case 'ellipse':
			element = new ShapeElement(type);
			break;
		default:
			throw new Error('Element ' + type + ' is not supported');
			break;
	}
	return element;
};

export default ElementFactory;