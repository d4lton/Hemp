/**
 * Hemp
 * Text Element
 *
 * Copyright ©2017 Dana Basken <dbasken@gmail.com>
 *
 */

import Element from './Element.js';
import CanvasText from '../CanvasText/CanvasText.js';

function TextElement(environment, object) {
  Element.call(this, environment, object);
};

TextElement.prototype = Object.create(Element.prototype);
TextElement.prototype.constructor = TextElement;

/************************************************************************************/

TextElement.prototype.renderElement = function() {
  CanvasText.drawText(this._context, this._object);
};

export default TextElement;