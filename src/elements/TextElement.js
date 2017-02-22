import Element from './Element.js';
import CanvasText from '../CanvasText/CanvasText.js';

/**
 * Text Element
 */

function TextElement() {
  Element.call(this);
}

TextElement.prototype = Object.create(Element.prototype);
TextElement.prototype.constructor = TextElement;

/************************************************************************************/

TextElement.prototype.renderElement = function(object) {
  CanvasText.drawText(this.context, object);
};

export default TextElement;