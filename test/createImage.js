var fs = require("fs");

var createImage = function (destination) {

  //console.log('createImage');
  //console.log(arguments);


  fs.writeFileSync(destination, "Hey there!", 'utf8', function (err) {
    if (err) {
      return console.log(err);
    }
  });

  return;


  /*
    var processor = require('lwip');

    processor.open(source, function (err, image) {

      if (err) {
        console.log(err);
      }

      console.log(image);

      image.writeFile(destination, function (err) {
        if (err) {
          console.log(err);
        }
        console.log("written");
      });


    });
  */


};


module.exports = createImage;