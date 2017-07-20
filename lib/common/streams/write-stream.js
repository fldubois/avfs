'use strict';

var stream = require('stream');
var util   = require('util');

module.exports = function (fs) {
  function WriteStream(path, options) {
    if (!(this instanceof WriteStream)) {
      return new WriteStream(path, options);
    }

    stream.Writable.call(this);

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
    this.fd = fs.open(this.path, this.flags, this.mode, function (error, fd) {
      if (error) {
        this.destroy();

        if (typeof error.code === 'string') {
          error.message = error.code + ', open \'' + this.path + '\'';
          delete error.syscall;
        }

        return this.emit('error', error);
      }

      this.fd = fd;

      this.emit('open', this.fd);
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

    fs.write(this.fd, data, 0, data.length, this.pos, function (error, written) {
      if (error) {
        return callback(error);
      }

      this.bytesWritten += written;

      return callback();
    }.bind(this));

    if (this.pos !== null) {
      this.pos += data.length;
    }
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
    fs.close(fd || this.fd, function (error) {
      if (error) {
        return this.emit('error', error);
      }

      this.emit('close');
    }.bind(this));

    this.fd = null;
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

  return WriteStream;
};
