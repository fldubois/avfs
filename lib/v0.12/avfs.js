'use strict';

var util = require('util');

var assign = require('object-assign');

var constants = require('../common/constants');
var errors    = require('../common/errors');
var utils     = require('../common/utils');

var LegacyVFS = require('../v0.10/avfs');

var storageErrors = function (syscall) {
  return {
    ENOENT: function (error) {
      return errors.ENOENT({syscall: syscall, path: error.path});
    },
    ENOTDIR: function (error) {
      return errors.ENOTDIR({syscall: syscall, path: error.path});
    }
  };
};

function VirtualFS() {
  LegacyVFS.apply(this, arguments);

  assign(this.base, require('../common/avfs/access')(this.storage, constants));

  ['F_OK', 'R_OK', 'W_OK', 'X_OK'].forEach(function (key) {
    Object.defineProperty(this, key, {
      value:      constants[key],
      enumerable: true,
      writable:   false
    });
  }.bind(this));
}

util.inherits(VirtualFS, LegacyVFS);

VirtualFS.prototype.accessSync = function (path, mode) {
  errors.nullCheck(path);

  if (typeof path !== 'string') {
    throw new TypeError('path must be a string');
  }

  return utils.invoke(this.base.access, [path, mode], assign(storageErrors('access'), {
    EACCES: function () {
      return errors.EACCES({syscall: 'access', path: path});
    },
    EINVAL: function () {
      return errors.EINVAL({syscall: 'access', path: path});
    }
  }));
};

VirtualFS.prototype.readdirSync = function (filepath) {
  try {
    return LegacyVFS.prototype.readdirSync.call(this, filepath);
  } catch (error) {
    if (['ENOENT', 'ENOTDIR'].indexOf(error.code) !== -1 && typeof error.syscall === 'string') {
      throw errors[error.code]({syscall: 'scandir', path: filepath});
    }

    throw error;
  }
};

VirtualFS.prototype.readSync = function (fd, buffer, offset, length, position) {
  try {
    return LegacyVFS.prototype.readSync.call(this, fd, buffer, offset, length, position);
  } catch (error) {
    if (error.message === 'Length extends beyond buffer') {
      throw new RangeError('Length extends beyond buffer');
    }

    throw error;
  }
};

// TODO: type parameter support
VirtualFS.prototype.symlinkSync = function (srcpath, dstpath) {
  try {
    return LegacyVFS.prototype.symlinkSync.call(this, srcpath, dstpath);
  } catch (error) {
    if (error.code === 'EEXIST' && typeof error.syscall === 'string') {
      throw errors.EEXIST({syscall: 'symlink', path: dstpath});
    }

    if (['ENOENT', 'ENOTDIR', 'EACCES'].indexOf(error.code) !== -1 && typeof error.syscall === 'string') {
      throw errors[error.code]({syscall: 'symlink', path: srcpath});
    }

    throw error;
  }
};

VirtualFS.prototype.writeSync = function (fd, buffer, offset, length, position) {
  if (Buffer.isBuffer(buffer) && offset > buffer.length && length === 0) {
    throw new RangeError('offset out of bounds');
  }

  try {
    return LegacyVFS.prototype.writeSync.call(this, fd, buffer, offset, length, position);
  } catch (error) {
    if (error.message === 'Offset is out of bounds') {
      throw new RangeError('offset out of bounds');
    }

    if (error.message === 'off + len > buffer.length') {
      throw new RangeError('length out of bounds');
    }

    throw error;
  }
};

module.exports = VirtualFS;
