'use strict';

var flags = require('./flags');

function Descriptor(filepath, fgs) {
  this.path   = filepath;
  this.flags  = fgs;
  this.read   = 0;
  this.write  = 0;
  this.closed = false;
}

Descriptor.prototype.isReadable = function () {
  return !!(this.flags & (flags.RW | flags.RO));
};

Descriptor.prototype.isWritable = function () {
  return !!(this.flags & (flags.RW | flags.WO));
};

Descriptor.prototype.isClosed = function () {
  return this.closed;
};

Descriptor.prototype.close = function () {
  this.closed = true;
};

module.exports = Descriptor;
