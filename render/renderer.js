var page = require('webpage').create();
var WebFont = require('webfontloader');


var fonts = [
  'Comic Sans MS',
  'Arial',
  'Baskerville',
  'Zapfino',
  'Impact',
  'Alin Square Emoji'
];

var template = {
  width: 1000,
  height: 1000,
  objects: []
};

var x = 320;
var y = 100;
fonts.forEach(function(font) {
  template.objects.push(
    {
      padding: 0,
      type: 'text',
      text: font,
      x: x,
      y: y,
      width: 500,
      height: 80,
      align: 'center',
      valign: 'middle',
      font: '40pt ' + font,
      color: '#FF8080',
      alpha: 1.0,
      backgroundColor: '#000000'
    }
/*
    {
      type: 'text',
      text: font,
      x: x,
      y: y,
      width: 500,
      height: 100,
      align: 'center',
      valign: 'middle',
      font: '40pt serif',
      color: '#808080',
      alpha: 0.5
    }
*/
  );
  y += 100;
  if (y > template.height-100) {
    x = x + 500;
    y = 20;
  };
});

page.viewportSize = {
  width: template.width,
  height: template.height
};

page.onConsoleMessage = function(msg) {
  console.log('console message: ', msg);
};

page.injectJs('./promise.js');
page.injectJs('../dist/Hemp.umd.js');

(page.evaluate(function(template) {

/*
var style = document.createElement('style');
style.appendChild(document.createTextNode("@font-face {font-family: 'Alin Square Emoji'; src: url('http://www.basken.com/Alin_Square_Emoji.ttf')}"));
document.head.appendChild(style);
*/

  //var fred = new FontFace("Alin Square Emoji", "url(http://www.basken.com/fonts/Alin_Square_Emoji.ttf)");

  

  var hemp = new Hemp(template.width, template.height);
  hemp.getEnvironment().canvas.style.backgroundColor = 'white';
  hemp.setObjects(template.objects, function() {
    window.renderDone = true;
  }.bind(this));
  document.body.appendChild(hemp.getEnvironment().canvas);

}, template));

setInterval(function() {
  if (page.evaluate(function() {return window.renderDone;})) {
    page.render('/dev/stdout', {format: 'jpeg', quality: '100'});
    phantom.exit();
  }
}, 25);
