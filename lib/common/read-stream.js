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
  setImmediate(function () {
    try {
      this.fd = this.fs.openSync(this.path, this.flags, this.mode);

      this.emit('open', this.fd);
      this.read();
    } catch (error) {
      if (this.autoClose) {
        this.destroy();
      }

      if (typeof error.code === 'string') {
        error.message = error.code + ', open \'' + this.path + '\'';
        delete error.syscall;
      }

      this.emit('error', error);
    }
  }.bind(this));
};

ReadStream.prototype._read = function (size) {
  if (typeof this.fd !== 'number') {
    return this.once('open', function () {
      this._read(size);
    }.bind(this));
  }

  if (this.destroyed === true) {
    return;
  }

  setImmediate(function () {
    var toRead = size;

    if (this.pos !== null) {
      toRead = Math.min(this.end - this.pos + 1, toRead);
    }

    if (toRead <= 0) {
      return this.push(null);
    }

    var buffer = new Buffer(toRead);

    try {
      var bytesRead = this.fs.readSync(this.fd, buffer, 0, toRead, this.pos);

      if (this.pos !== null) {
        this.pos += bytesRead;
      }

      this.push(bytesRead > 0 ? buffer.slice(0, bytesRead) : null);
    } catch (error) {
      if (this.autoClose) {
        this.destroy();
      }

      this.emit('error', error);
    }
  }.bind(this));
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
  setImmediate(function () {
    try {
      this.fs.closeSync(fd || this.fd);

      this.emit('close');
    } catch (error) {
      this.emit('error', error);
    }

    this.fd = null;
  }.bind(this));
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
