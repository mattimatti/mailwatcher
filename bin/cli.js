#!/usr/bin/env node

'use strict';


// Create the command line application 



var cli = require('cli');
var colors = require('colors');
var App = require('../lib/app.js');
var util = require('util');
var Table = require('cli-table');
var path = require('path');
var fs = require('fs');
var request = require('request');


var config = JSON.parse(fs.readFileSync('.config.json', 'utf8'));

//console.log(config);

var app;


// Enable Plugins
cli.enable('version');



var theFolder = path.dirname(require.main.filename);
var theFile = path.resolve(theFolder + '/../package.json');

cli.setApp(theFile);


var usage = "\t";

usage += "Description here." + "\n\t";

cli.setUsage(usage);

cli.width = 120;


// Add here the command line options
cli.parse({
	url: [false, 'Define the url from where to start the crawling', 'string', 'http://127.0.0.1'],
	debug: ['d', 'Debug. Set the logger level to debug. Overrides --logLevel']
});


// Execute main function

cli.main(function (args, options) {


	try {

		app = new App();
		app.initialize(config);
		app.start();

	} catch (err) {

	}


});