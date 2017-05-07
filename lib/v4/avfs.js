'use strict';

var util = require('util');

var errors = require('../common/errors');

var LegacyVFS = require('../v0.12/avfs');

function VirtualFS() {
  LegacyVFS.apply(this, arguments);
}

util.inherits(VirtualFS, LegacyVFS);

VirtualFS.prototype.appendFileSync = function (filename, data, options) {
  try {
    return LegacyVFS.prototype.appendFileSync.call(this, filename, data, options);
  } catch (error) {
    if (error.message === 'Bad arguments') {
      var type = typeof options;

      throw new TypeError('Expected options to be either an object or a string, but got ' + type + ' instead');
    }

    throw error;
  }
};

VirtualFS.prototype.chmodSync = function (filepath, mode) {
  try {
    return LegacyVFS.prototype.chmodSync.call(this, filepath, mode);
  } catch (error) {
    if (error.message === 'Bad argument') {
      if (typeof filepath !== 'string') {
        throw new TypeError('path must be a string');
      }

      throw new TypeError('mode must be an integer');
    }

    throw error;
  }
};

VirtualFS.prototype.closeSync = function (fd) {
  try {
    return LegacyVFS.prototype.closeSync.call(this, fd);
  } catch (error) {
    if (error.message === 'Bad argument') {
      throw new TypeError('fd must be a file descriptor');
    }

    throw error;
  }
};

VirtualFS.prototype.fchmodSync = function (fd, mode) {
  try {
    return LegacyVFS.prototype.fchmodSync.call(this, fd, mode);
  } catch (error) {
    if (error.message === 'Bad argument') {
      if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
        throw new TypeError('fd must be a file descriptor');
      }

      throw new TypeError('mode must be an integer');
    }

    throw error;
  }
};

VirtualFS.prototype.fstatSync = function (fd) {
  try {
    return LegacyVFS.prototype.fstatSync.call(this, fd);
  } catch (error) {
    if (error.message === 'Bad argument') {
      throw new TypeError('fd must be a file descriptor');
    }

    throw error;
  }
};

VirtualFS.prototype.fsyncSync = function (fd) {
  try {
    return LegacyVFS.prototype.fsyncSync.call(this, fd);
  } catch (error) {
    if (error.message === 'Bad argument') {
      throw new TypeError('fd must be a file descriptor');
    }

    throw error;
  }
};

VirtualFS.prototype.ftruncateSync = function (fd, length) {
  try {
    return LegacyVFS.prototype.ftruncateSync.call(this, fd, length);
  } catch (error) {
    if (error.message === 'Bad argument') {
      throw new TypeError('fd must be a file descriptor');
    }

    throw error;
  }
};

VirtualFS.prototype.linkSync = function (srcpath, dstpath) {
  try {
    return LegacyVFS.prototype.linkSync.call(this, srcpath, dstpath);
  } catch (error) {
    if (['EEXIST', 'ENOENT', 'ENOTDIR', 'EPERM'].indexOf(error.code) !== -1) {
      throw errors[error.code]({syscall: 'link', path: srcpath, dest: dstpath});
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
