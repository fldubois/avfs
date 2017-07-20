'use strict';

var stream = require('stream');
var util   = require('util');

module.exports = function (fs) {
  function SyncWriteStream(fd, options) {
    if (!(this instanceof SyncWriteStream)) {
      return new SyncWriteStream(fd, options);
    }

    stream.Stream.call(this);

    options = options || {};

    this.fd = fd;

    this.writable = true;
    this.readable = false;

    this.autoClose = options.hasOwnProperty('autoClose') ? options.autoClose : true;
  }

  util.inherits(SyncWriteStream, stream.Stream);

  SyncWriteStream.prototype.write = function (data, encoding, callback) {
    if (encoding) {
      if (typeof encoding === 'function') {
        callback = encoding;
        encoding = void 0;
      } else if (typeof encoding !== 'string') {
        throw new Error('bad arg');
      }
    }

    if (encoding && !Buffer.isEncoding(encoding)) {
      throw new Error('Unknown encoding: ' + encoding);
    }

    if (typeof data === 'string') {
      data = new Buffer(data, encoding);
    }

    fs.writeSync(this.fd, data, 0, data.length);

    if (callback) {
      process.nextTick(callback);
    }

    return true;
  };


  SyncWriteStream.prototype.end = function (data, encoding, callback) {
    if (data) {
      this.write(data, encoding, callback);
    }

    this.destroy();
  };


  SyncWriteStream.prototype.destroy = function () {
    if (this.fd !== null) {
      if (this.autoClose) {
        fs.closeSync(this.fd);
      }

      this.fd = null;
    }

    this.emit('close');

    return true;
  };

  SyncWriteStream.prototype.destroySoon = SyncWriteStream.prototype.destroy;

  return SyncWriteStream;
};
