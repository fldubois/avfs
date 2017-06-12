'use strict';

var constants = require('../constants');

function Descriptor(file, path, fgs) {
  this.file   = file;
  this.path   = path;
  this.flags  = fgs;
  this.read   = 0;
  this.write  = 0;
  this.closed = false;
}

Descriptor.prototype.isReadable = function () {
  return !!(this.flags & (constants.O_RDWR | constants.O_RDONLY));
};

Descriptor.prototype.isWritable = function () {
  return !!(this.flags & (constants.O_RDWR | constants.O_WRONLY));
};

Descriptor.prototype.isClosed = function () {
  return this.closed;
};

Descriptor.prototype.close = function () {
  this.closed = true;
};

module.exports = Descriptor;