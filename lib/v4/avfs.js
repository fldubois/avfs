'use strict';

var util = require('util');

var assign = require('object-assign');

var errors = require('../common/errors');

var LegacyVFS = require('../v0.12/avfs');

function VirtualFS() {
  LegacyVFS.apply(this, arguments);

  assign(this.base, require('../common/avfs/temp')());

  delete this.SyncWriteStream;
}

util.inherits(VirtualFS, LegacyVFS);

VirtualFS.prototype.linkSync = function (srcpath, dstpath) {
  try {
    return LegacyVFS.prototype.linkSync.call(this, srcpath, dstpath);
  } catch (error) {
    if (['EEXIST', 'ENOENT', 'ENOTDIR', 'EPERM'].indexOf(error.code) !== -1 && typeof error.syscall === 'string') {
      throw errors[error.code]({syscall: 'link', path: srcpath, dest: dstpath});
    }

    throw error;
  }
};

VirtualFS.prototype.mkdtemp = function (prefix, callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }

  if (!errors.nullCheck(prefix, callback)) {
    return;
  }

  process.nextTick(callback, null, this.mkdtempSync(prefix));
};

VirtualFS.prototype.mkdtempSync = function (prefix) {
  errors.nullCheck(prefix);

  return this.base.mkdtemp(prefix);
};

VirtualFS.prototype.renameSync = function (oldPath, newPath) {
  try {
    return LegacyVFS.prototype.renameSync.call(this, oldPath, newPath);
  } catch (error) {
    if (['ENOENT', 'EINVAL', 'ENOTDIR', 'EACCES'].indexOf(error.code) !== -1 && typeof error.syscall === 'string') {
      throw errors[error.code]({syscall: 'rename', path: oldPath, dest: newPath});
    }

    throw error;
  }
};

// TODO: type parameter support
VirtualFS.prototype.symlinkSync = function (srcpath, dstpath) {
  try {
    return LegacyVFS.prototype.symlinkSync.call(this, srcpath, dstpath);
  } catch (error) {
    if (error.message === 'dest path must be a string') {
      throw new TypeError('target path must be a string');
    }

    if (error.code === 'EEXIST' && typeof error.syscall === 'string') {
      throw errors.EEXIST({syscall: 'symlink', path: srcpath, dest: dstpath});
    }

    if (['ENOENT', 'ENOTDIR', 'EACCES'].indexOf(error.code) !== -1 && typeof error.syscall === 'string') {
      throw errors[error.code]({syscall: 'symlink', path: srcpath, dest: dstpath});
    }

    throw error;
  }
};

module.exports = VirtualFS;
