'use strict';

var flags = require('./flags');

function Descriptor(filepath, fgs) {
  this.path  = filepath;
  this.flags = fgs;
  this.read  = 0;
  this.write = 0;
}

Descriptor.prototype.isReadable = function () {
  return !!(this.flags & (flags.RW | flags.RO));
};

Descriptor.prototype.isWritable = function () {
  return !!(this.flags & (flags.RW | flags.WO));
};

module.exports = Descriptor;
