'use strict';

var stream = require('stream');
var util   = require('util');

function WriteStream(fs, path, options) {
  if (!(this instanceof WriteStream)) {
    return new WriteStream(fs, path, options);
  }

  stream.Writable.call(this);

  Object.defineProperty(this, 'fs', {
    value:        fs,
    configurable: false,
    enumerable:   false,
    writable:     false
  });

  options = options || {};

  this.path = path;

  this.fd    = options.hasOwnProperty('fd')    ? options.fd    : null;
  this.flags = options.hasOwnProperty('flags') ? options.flags : 'w';
  this.mode  = options.hasOwnProperty('mode')  ? options.mode  : null;
  this.start = options.hasOwnProperty('start') ? options.start : null;

  this.pos          = null;
  this.bytesWritten = 0;

  if (this.start !== null) {
    if (typeof this.start !== 'number') {
      throw new TypeError('start must be a Number');
    }

    if (this.start < 0) {
      throw new Error('start must be >= zero');
    }

    this.pos = this.start;
  }

  if ('number' !== typeof this.fd) {
    this.open();
  }

  this.once('finish', this.close);
}

util.inherits(WriteStream, stream.Writable);

WriteStream.prototype.open = function () {
  setImmediate(function () {
    try {
      this.fd = this.fs.openSync(this.path, this.flags, this.mode);

      this.emit('open', this.fd);
    } catch (error) {
      this.destroy();

      if (typeof error.code === 'string') {
        error.message = error.code + ', open \'' + this.path + '\'';
        delete error.syscall;
      }

      this.emit('error', error);
    }
  }.bind(this));
};

WriteStream.prototype._write = function (data, encoding, callback) {
  if (!Buffer.isBuffer(data)) {
    return this.emit('error', new Error('Invalid data'));
  }

  if (typeof this.fd !== 'number') {
    return this.once('open', function () {
      this._write(data, encoding, callback);
    }.bind(this));
  }

  setImmediate(function () {
    try {
      var written = this.fs.writeSync(this.fd, data, 0, data.length, this.pos);

      this.bytesWritten += written;

      if (this.pos !== null) {
        this.pos += data.length;
      }

      return callback();
    } catch (error) {
      return callback(error);
    }
  }.bind(this));
};

WriteStream.prototype.destroy = function () {
  if (!this.destroyed) {
    this.destroyed = true;

    if (typeof this.fd === 'number') {
      this.close();
    }
  }
};

WriteStream.prototype._close = function (fd) {
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

WriteStream.prototype.close = function (callback) {
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

WriteStream.prototype.destroySoon = WriteStream.prototype.end;

module.exports = WriteStream;
