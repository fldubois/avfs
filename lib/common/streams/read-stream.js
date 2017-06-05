'use strict';

var stream = require('stream');
var util   = require('util');

var DEFAULT_WATERMARK = 65536; // 64 * 1024

function ReadStream(fs, path, options) {
  if (!(this instanceof ReadStream)) {
    return new ReadStream(fs, path, options);
  }

  options = options || {};

  if (!(options.hasOwnProperty('highWaterMark'))) {
    options.highWaterMark = DEFAULT_WATERMARK;
  }

  stream.Readable.call(this, options);

  Object.defineProperty(this, 'fs', {
    value:        fs,
    configurable: false,
    enumerable:   false,
    writable:     false
  });

  this.path = path;

  this.fd    = options.hasOwnProperty('fd')    ? options.fd    : null;
  this.flags = options.hasOwnProperty('flags') ? options.flags : 'r';
  this.mode  = options.hasOwnProperty('mode')  ? options.mode  : parseInt('666', 8);

  this.start = options.hasOwnProperty('start') ? options.start : null;
  this.end   = options.hasOwnProperty('end')   ? options.end   : null;

  this.autoClose = options.hasOwnProperty('autoClose') ? options.autoClose : true;

  this.pos = null;

  if (this.start !== null) {
    if (typeof this.start !== 'number') {
      throw new TypeError('start must be a Number');
    }

    if (this.end === null) {
      this.end = Infinity;
    } else if (typeof this.end !== 'number') {
      throw new TypeError('end must be a Number');
    }

    if (this.start > this.end) {
      throw new Error('start must be <= end');
    }

    this.pos = this.start;
  }

  if ('number' !== typeof this.fd) {
    this.open();
  }

  this.on('end', /* @this ReadStream */ function () {
    if (this.autoClose) {
      this.destroy();
    }
  });
}

util.inherits(ReadStream, stream.Readable);

ReadStream.prototype.open = function () {
  this.fd = this.fs.open(this.path, this.flags, this.mode, function (error, fd) {
    if (error) {
      if (this.autoClose) {
        this.destroy();
      }

      if (typeof error.code === 'string') {
        error.message = error.code + ', open \'' + this.path + '\'';
        delete error.syscall;
      }

      return this.emit('error', error);
    }

    this.fd = fd;

    this.emit('open', this.fd);
    this.read();
  }.bind(this));
};

ReadStream.prototype._read = function (size) {
  if (this.destroyed === true) {
    return;
  }

  if (typeof this.fd !== 'number') {
    return this.once('open', function () {
      this._read(size);
    }.bind(this));
  }

  var toRead = size;

  if (this.pos !== null) {
    toRead = Math.min(this.end - this.pos + 1, toRead);
  }

  if (toRead <= 0) {
    return this.push(null);
  }

  this.fs.read(this.fd, new Buffer(toRead), 0, toRead, this.pos, function (error, bytesRead, buffer) {
    if (error) {
      if (this.autoClose) {
        this.destroy();
      }

      return this.emit('error', error);
    }

    this.push(bytesRead > 0 ? buffer.slice(0, bytesRead) : null);
  }.bind(this));

  if (this.pos !== null) {
    this.pos += toRead;
  }
};

ReadStream.prototype.destroy = function () {
  if (!this.destroyed) {
    this.destroyed = true;

    if (typeof this.fd === 'number') {
      this.close();
    }
  }
};

ReadStream.prototype._close = function (fd) {
  this.fs.close(fd || this.fd, function (error) {
    if (error) {
      return this.emit('error', error);
    }

    this.emit('close');
  }.bind(this));

  this.fd = null;
};

ReadStream.prototype.close = function (callback) {
  if (callback) {
    this.once('close', callback);
  }

  if (typeof this.fd !== 'number') {
    this.once('open', this._close);

    return;
  }

  if (this.closed === true) {
    return process.nextTick(this.emit.bind(this, 'close'));
  }

  this.closed = true;

  this._close();
};

ReadStream.prototype.destroySoon = ReadStream.prototype.end;

module.exports = ReadStream;
