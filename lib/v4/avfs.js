'use strict';

var util = require('util');

var errors = require('../common/errors');

var LegacyVFS = require('../v0.12/avfs');

function VirtualFS() {
  LegacyVFS.apply(this, arguments);
}

util.inherits(VirtualFS, LegacyVFS);

VirtualFS.prototype.linkSync = function (srcpath, dstpath) {
  try {
    return LegacyVFS.prototype.linkSync.call(this, srcpath, dstpath);
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw errors.EEXIST({syscall: 'link', path: srcpath, dest: dstpath});
    }

    throw error;
  }
};

// TODO: type parameter support
VirtualFS.prototype.symlinkSync = function (srcpath, dstpath) {
  try {
    return LegacyVFS.prototype.symlinkSync.call(this, srcpath, dstpath);
  } catch (error) {
    if (error.code === 'EEXIST') {
      throw errors.EEXIST({syscall: 'symlink', path: srcpath, dest: dstpath});
    }

    throw error;
  }
};

module.exports = VirtualFS;
