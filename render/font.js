var webPage = require('webpage');
var page = webPage.create();

page.injectJs('./promise.js');

page.viewportSize = { width: 1920, height: 1080 };
page.open("http://www.basken.com/canvas", function start(status) {
  page.render('canvas.jpg', {format: 'jpeg', quality: '100'});
  phantom.exit();
});

