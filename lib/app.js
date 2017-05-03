var events = require('events');
var watch = require('watch');
var _ = require('underscore');
var _s = require('underscore.string');
var fs = require('fs');
var path = require('path');
var nodemailer = require('nodemailer');
var JSFtp = require("jsftp");
var request = require('request');
var Dropbox = require("dropbox");
var validator = require("email-validator");
var Promise = require('promise');
var mkdirp = require('mkdirp');
var log = require('npmlog');



var Application = function() {

	this.config = {};
	this.transporter = null;

	events.EventEmitter.call(this);
};


// Create prototype

_.extend(Application.prototype, {


	initialize: function(options) {

		var config = {};
		_.extend(config, options);

		this.config = config;


		log.level = this.config.logLevel;

		if (this.config.logFile) {
			console.log('logging to ' + this.config.logFile);
			log.stream = fs.createWriteStream(this.config.logFile);
		}


		if (!this.folderExists(this.config.watchedFolder)) {
			throw new Error("Invalid folder: " + this.config.watchedFolder);
		}

		if (!this.folderExists(this.config.processedFolder)) {
			throw new Error("Invalid folder: " + this.config.processedFolder);
		}

		if (!this.folderExists(this.config.sendfailFolder)) {
			throw new Error("Invalid folder: " + this.config.sendfailFolder);
		}


	},


	// Initilaize services
	initServices: function() {

		console.info("init services");

		/*
		if (this.config.dropbox) {
			this.dropbox = new Dropbox.Client(this.config.dropbox.auth);
			this.dropbox.authDriver(new Dropbox.AuthDriver.NodeServer(8191));
			this.dropbox.authenticate(function (error, client) {
				if (error) {
					log.info(error);
					return;
				}

				log.info('inited dropbox');
				//log.info(client);
			});
		}*/


		// Fetch and save the template
		this.getTemplate();


		if (this.config.ftp) {
			this.ftp = new JSFtp(this.config.ftp);
			console.info("created ftp");
		}



		if (this.config.smtp) {
			this.transporter = nodemailer.createTransport(this.config.smtp);

			log.info('inited email service');
		}

	},


	// Start application
	start: function() {

		log.info('start application');

		this.initServices();

		var opts = {
			ignoreDotFiles: true
		};



		// Create the watchfolder
		watch.createMonitor(this.config.watchedFolder, opts, _.bind(this.onMonitorCreated, this));

	},


	folderExists: function(folder) {

		try {
			var stats = fs.lstatSync(folder);
			if (stats.isDirectory()) {
				return true;
			}
		} catch (err) {

		}
		return false;

	},


	// Handle the watcher created

	onMonitorCreated: function(monitor) {


		log.info('watching folder for created files : ' + this.config.watchedFolder);


		// Activate only created event

		monitor.on("created", _.bind(this.process, this));

		/*
		monitor.on("changed", _.bind(this.process, this));

		monitor.on("removed", function (f, stat) {
			log.info('removed: ' + f);
		});
		*/

	},


	// Upload the file via ftp

	uploadFile: function(file) {

		var self = this;

		var promise = new Promise(function(resolve, reject) {


			log.info('uploadFile: ' + file);

			var buffer = fs.readFileSync(file);
			var content = buffer.toString('utf-8', 0, buffer.length);

			var fileName = self.config.dropbox.destFolder + path.basename(file);


			if (self.ftp) {
				self.ftp.put(buffer, fileName, function(err) {

					if (!err) {
						log.info("File transferred successfully!");
						resolve();
					} else {
						log.error(err);
						reject(err);
					}

				});
			} else {
				log.error("missing ftp");
				reject(err);
			}


		});

		return promise;

	},



	// Upload the file via dropbox

	uploadFileDropbox: function(file) {

		var self = this;
		var promise = new Promise(function(resolve, reject) {


			log.info('uploadFileDropbox: ' + file);

			var buffer = fs.readFileSync(file);
			var content = buffer.toString('utf-8', 0, buffer.length);

			var fileName = self.config.dropbox.destFolder + path.basename(file);


			// in case we use dropbox
			if (self.dropbox) {

				self.dropbox.writeFile(fileName, buffer, function(error, stat) {
					if (error) {
						log.error(error);

						reject(error);

						return;
					}


					//log.info(stat);

					resolve(stat);
				});

			}

		});

		return promise;

	},



	logToDropboxFile: function(file, reason, content) {

		var fileName = this.config.dropbox.destFolder + path.basename(file);
		fileName += "." + reason + ".png";

		this.dropbox.writeFile(fileName, content, function(error, stat) {
			if (error) {
				log.error(error);
				return;
			}
			log.info("logged " + reason + " to dropbox");
		});


	},


	logToFile: function(file, reason, content) {

		var self = this;

		var fileName = this.config.dropbox.destFolder + path.basename(file);
		fileName += "." + reason + ".png";

		if (self.ftp) {
			self.ftp.put(buffer, fileName, function(err) {

				if (!err) {
					log.info("logged " + reason);

				} else {
					log.error(err);
				}

			});
		}


	},



	// Move the file to processed folder
	moveFile: function(file, destFolder) {

		if (destFolder) {
			mkdirp(destFolder);
		}

		var fileName = path.basename(file);
		var destFile = destFolder + '/' + fileName;

		fs.renameSync(file, destFile);

		return destFile;

	},



	// Prepare the message parameters

	prepareMessage: function(file) {


		// The filename
		var fileName = path.basename(file);


		// Replace the public url wit the file name
		var publicUrl = this.config.dropbox.publicUrl;
		publicUrl = _s.replaceAll(publicUrl, "{file}", encodeURIComponent(fileName));


		// Load the template
		var html = fs.readFileSync('template.html', 'utf8');
		html = _s.replaceAll(html, "{image}", publicUrl);


		log.info(html);

		// get the name
		var parsed = path.parse(file);

		return {
			to: parsed.name,
			html: html
		};

	},


	// Load the template from remote location 
	getTemplate: function(file) {
		if (this.config.templateURL && !_.isEmpty(this.config.templateURL)) {
			request(this.config.templateURL).pipe(fs.createWriteStream('./template.html'));
		}

		log.info("update local template from " + this.config.templateURL);
	},


	/*
		// Log somewhere the sent email.
		logEmailSent: function (err, obj) {

			if (err) {
				log.info("err", err);
				return;
			}

			return;


			if (this.config.logService && !_.isEmpty(this.config.logService)) {

				log.info('logging');
				log.info(obj);

				obj = obj || {};

				var json = obj;

				request({
					url: this.config.logService,
					method: "POST",
					json: true,
					body: obj
				}, function (error, response, body) {
					log.info("logged");
					log.info(body);
				});
			}
		},
	*/


	// Send the message 
	sendMessage: function(message, file) {

		var self = this;

		var promise = new Promise(function(resolve, reject) {

			// Merge the mail

			var mailParams = self.config.mail;
			_.extend(mailParams, message);


			if (self.transporter) {

				log.info("mailParams", mailParams);


				self.transporter.sendMail(mailParams, function(err, obj) {

					if (err) {

						log.error("sent", "error sending email");
						log.error("sent", err);

						self.logToFile(file, 'error', JSON.stringify(err));

						reject(err);

						return;
					}

					log.info("sendResponse", obj);


					resolve();

				});
			}

		});


		return promise;

	},



	// Check if the file matches the defined extension
	isValidFile: function(file) {


		// validate is a jpeg
		var patt1 = /\.[jpeg|jpg]+$/ig;
		if (file.match(patt1) === null) {
			return false;
		}

		// get the name
		var parsed = path.parse(file);


		// validate email address
		if (!validator.validate(parsed.name)) {
			return false;
		}

		return true;

	},



	// Process a file (full path)
	process: function(file) {


		var self = this;

		log.info('process', 'created file: ' + file);

		if (!this.isValidFile(file)) {
			log.info("invalid file name " + file);
			this.moveFile(file, self.config.sendfailFolder);
			return;
		}


		//upload the file, then send the message 

		this.uploadFile(file).then(function(stat) {


			log.info('process', "file uploaded successfully");

			var message = self.prepareMessage(file);

			if (message === false) {
				log.error('process', "invalid message, move");
				self.moveFile(file, self.config.sendfailFolder);
				return;
			}


			log.info('process', "send message");

			self.sendMessage(message, file).then(function() {

				self.moveFile(file, self.config.processedFolder);

				self.getTemplate();

				log.info('process', "------- file processed successfully, ready for next -------\n\n\n");


			}).catch(function() {
				log.error('process', "------- error sending email -------");
				self.moveFile(file, self.config.sendfailFolder);
			});



		});



	}

});



module.exports = Application;