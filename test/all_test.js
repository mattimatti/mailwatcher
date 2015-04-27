'use strict';

var Application = require('../lib/app.js');

var fs = require("fs");
var mkdirp = require('mkdirp');
var _ = require('underscore');
var fse = require('fs-extra');

/*
  ======== A Handy Little Nodeunit Reference ========
  https://github.com/caolan/nodeunit

  Test methods:
    test.expect(numAssertions)
    test.done()
  Test assertions:
    test.ok(value, [message])
    test.equal(actual, expected, [message])
    test.notEqual(actual, expected, [message])
    test.deepEqual(actual, expected, [message])
    test.notDeepEqual(actual, expected, [message])
    test.strictEqual(actual, expected, [message])
    test.notStrictEqual(actual, expected, [message])
    test.throws(block, [error], [message])
    test.doesNotThrow(block, [error], [message])
    test.ifError(value)
*/


var createImage = require('./createImage.js');



var options = {
	watchedFolder: './test/watched',
	processedFolder: './test/processed',
	dropbox: {
		publicURL: ''
	}
};



module.exports = {



	setUp: function (callback) {

		this.app = new Application();
		this.app.initialize(options);


		mkdirp(this.app.config.watchedFolder, function (err) {});
		mkdirp(this.app.config.processedFolder, function (err) {});

		callback();
	},



	tearDown: function (callback) {

		fse.emptyDirSync(this.app.config.watchedFolder);
		fse.emptyDirSync(this.app.config.processedFolder);

		this.app = null;

		callback();

	},



	initialize: function (test) {

		test.expect(1);
		test.deepEqual(this.app.config, options);
		test.done();
	},



	isValidFile: function (test) {



		test.expect(6);

		// is false 
		test.equal(this.app.isValidFile("pepe.jpeg"), false);
		test.equal(this.app.isValidFile("palla/pepe.jpeg"), false);
		test.equal(this.app.isValidFile("pepe.png"), false);


		test.equal(this.app.isValidFile("mmonti@gmail.com.jpeg"), true);
		test.equal(this.app.isValidFile("/path/mmonti@gmail.com.jpeg"), true);
		test.equal(this.app.isValidFile("mmonti@gmail.com"), false);



		test.done();

	},



	prepareMessage: function (test) {


		test.expect(1);

		fse.emptyDirSync(this.app.config.watchedFolder);

		var theFile = this.app.config.watchedFolder + '/mmonti@gmail.com.jpeg';
		createImage(theFile);


		var theMessage = this.app.prepareMessage(theFile);

		test.equal(theMessage.to, 'mmonti@gmail.com');

		test.done();

	},



	moveFile: function (test) {

		test.expect(4);

		var theFile = this.app.config.watchedFolder + '/test.jpeg';

		if (fs.existsSync(theFile)) {
			fs.unlinkSync(theFile);
		}

		test.equal(fs.existsSync(theFile), false, 'should not exist');


		createImage(theFile);

		test.equal(fs.existsSync(theFile), true);


		var destFile = this.app.moveFile(theFile);


		test.equal(fs.existsSync(theFile), false);
		test.equal(fs.existsSync(destFile), true);


		test.done();



	}

};