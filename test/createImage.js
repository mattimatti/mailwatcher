var fse = require('fs-extra');

var createImage = function (destination) {
  var source = './test/assets/mmonti@gmail.com.jpeg';
  fse.copySync(source, destination);

};


module.exports = createImage;