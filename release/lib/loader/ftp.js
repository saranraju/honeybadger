// Copyright Impact Marketing Specialists, Inc. and other contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

module.exports = FTP;

/** log facility */
var log = require('debug')('HoneyBadger:Loader:FTP');

/** core deps */
var util = require('util');
var ftp = require('../helpers/transports/ftp');
var utilily = require('../utility');
var stream = require('stream');
var EventEmitter = require('events').EventEmitter;

util.inherits( FTP, EventEmitter );
util.inherits( FTP, stream.Transform );
function FTP( options ) {

	var $this = this;
	EventEmitter.call(this);
	stream.Transform.call(this, {objectMode: true});

	var beans = 0;

	var Client = require('ftp');
	var c = new Client();

	c.on('ready', function() {
		log('Connection ready, piping to remote target');
		c.put($this, 'good_office_extract.csv', function(err){
			log('Stream data transfer complete');
			c.end();
			if (err) {
				console.trace(err);
			}
		});
		$this.emit('ready');
	});

	c.on('close', function(){
		log('Connection closed');
		c.destroy();
	});

	c.on('error', function(err) {
		log('Error', err);
		console.trace(err);
	});

	c.connect({
		host: options.target.uri,
		port: options.target.port || '21',
		user: options.target.auth.username,
		password: options.target.auth.password
	});


	/** We are TOTALLY ASSUMING that chunks are records 
	 *  coming from a CSV stream processor. That's probably not
	 *  the safest assumption longterm ;)
	 */
	this._transform = function(chunk, encoding, callback) {

		beans++;
		// log('Processed record', beans);

		this.push(chunk.join(',')+'\r\n');
		return callback();
	};

	this._flush = function(callback){
		log('Completed '+beans+' records');
		callback();
	};
}