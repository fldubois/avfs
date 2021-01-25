'use strict';

var constants = require('constants');

var assign = require('object-assign');

var errors = require('./errors');

var parsers = require('../common/parsers')(constants);
var utils   = require('../common/utils');

var Storage = require('../common/storage');

var factories = {
  stats:           require('../common/components/stats'),
  readStream:      require('../common/streams/read-stream'),
  writeStream:     require('../common/streams/write-stream'),
  syncWriteStream: require('../common/streams/sync-write-stream')
};

function VirtualFS() {
  var storage = new Storage(constants);

  var handles = {
    next: 0
  };

  var base = assign({},
    require('../base/access')(storage, constants),
    require('../base/attributes')(storage, constants, {birthtime: true}),
    require('../base/descriptors')(storage, constants, handles),
    require('../base/directories')(storage, constants),
    require('../base/exists')(storage),
    require('../base/files')(storage, constants, handles),
    require('../base/links')(storage, constants),
    require('../base/permissions')(storage, constants),
    require('../base/read-write')(storage, constants, handles),
    require('../base/utils')(),
    require('../base/watchers')()
  );

  Object.defineProperty(this, 'storage', {
    value:        storage,
    configurable: false,
    enumerable:   false,
    writable:     false
  });

  Object.defineProperty(this, 'base', {
    value:        base,
    configurable: false,
    enumerable:   false,
    writable:     false
  });

  Object.defineProperty(this, 'handles', {
    value:        handles,
    configurable: false,
    enumerable:   false,
    writable:     false
  });

  ['F_OK', 'R_OK', 'W_OK', 'X_OK'].forEach(function (key) {
    Object.defineProperty(this, key, {
      value:      constants[key],
      enumerable: true,
      writable:   false
    });
  }.bind(this));

  // fs members

  this.Stats = factories.stats(constants, {birthtime: true});

  this.ReadStream  = factories.readStream(this);
  this.WriteStream = factories.writeStream(this);

  this.FileReadStream  = this.ReadStream;
  this.FileWriteStream = this.WriteStream;

  Object.defineProperty(this, 'SyncWriteStream', {
    configurable: true,
    writable:     true,
    value:        factories.syncWriteStream(this)
  });

  Object.defineProperty(this, '_stringToFlags', {
    enumerable: false,
    value:      parsers.flags
  });

  // Asynchronous methods

  var rethrow = function (error) {
    if (error) {
      throw error;
    }
  };

  utils.asyncify(this, {
    nocb:    rethrow,
    methods: ['readSync', 'writeSync'],
    error:   function (error) {
      if (error instanceof Error && !(/^E[A-Z]+/.test(error.code))) {
        throw error;
      }
    },
    transform: function (error, result, method, args, callback) {
      if (error) {
        error = errors[error.code](method);
      }

      return callback(error, result || 0, args[1]);
    }
  });

  utils.asyncify(this, rethrow);
}

VirtualFS.prototype.accessSync = function (path, mode) {
  errors.nullCheck(path);

  return utils.invoke(this.base.access, [path, mode], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    return errors[error.code]({syscall: 'access', path: path});
  });
};

VirtualFS.prototype.appendFileSync = function (file, data, options) {
  errors.nullCheck(file);

  return utils.invoke(this.base.appendFile, [file, data, options], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    if (error.code === 'options:type') {
      throw new TypeError('Expected options to be either an object or a string, but got ' + error.type + ' instead');
    }

    if (error.code === 'options:encoding') {
      throw new Error('Unknown encoding: ' + error.encoding);
    }

    return errors[error.code]({syscall: 'open', path: error.path || file});
  });
};

VirtualFS.prototype.chmodSync = function (path, mode) {
  errors.nullCheck(path);

  return utils.invoke(this.base.chmod, [path, mode], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    if (error.code === 'mode:type') {
      throw new TypeError('mode must be an integer');
    }

    return errors[error.code]({syscall: 'chmod', path: error.path || path});
  });
};

VirtualFS.prototype.chownSync = function (path, uid, gid) {
  errors.nullCheck(path);

  return utils.invoke(this.base.chown, [path, uid, gid], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    if (error.code === 'uid:type') {
      throw new TypeError('uid must be an unsigned int');
    }

    if (error.code === 'gid:type') {
      throw new TypeError('gid must be an unsigned int');
    }

    return errors[error.code]({syscall: 'chown', path: path});
  });
};

VirtualFS.prototype.closeSync = function (fd) {
  return utils.invoke(this.base.close, [fd], function (error) {
    if (error.code === 'fd:type') {
      throw new TypeError('fd must be a file descriptor');
    }

    return errors[error.code]({syscall: 'close'});
  });
};

VirtualFS.prototype.createReadStream = function (path, options) {
  return this.ReadStream(path, options);
};

VirtualFS.prototype.createWriteStream = function (path, options) {
  return this.WriteStream(path, options);
};

VirtualFS.prototype.existsSync = function (path) {
  return this.base.exists(path);
};

VirtualFS.prototype.fchmodSync = function (fd, mode) {
  return utils.invoke(this.base.fchmod, [fd, mode], function (error) {
    if (error.code === 'fd:type') {
      throw new TypeError('fd must be a file descriptor');
    }

    if (error.code === 'mode:type') {
      throw new TypeError('mode must be an integer');
    }

    return errors[error.code]({syscall: 'fchmod'});
  });
};

VirtualFS.prototype.fchownSync = function (fd, uid, gid) {
  return utils.invoke(this.base.fchown, [fd, uid, gid], function (error) {
    if (error.code === 'fd:type') {
      throw new TypeError('fd must be an int');
    }

    if (error.code === 'uid:type') {
      throw new TypeError('uid must be an unsigned int');
    }

    if (error.code === 'gid:type') {
      throw new TypeError('gid must be an unsigned int');
    }

    return errors[error.code]({syscall: 'fchown'});
  });
};

VirtualFS.prototype.fdatasyncSync = function (fd) {
  return utils.invoke(this.base.fdatasync, [fd], function (error) {
    if (error.code === 'fd:type') {
      throw new TypeError('fd must be a file descriptor');
    }

    return errors[error.code]({syscall: 'fdatasync'});
  });
};

VirtualFS.prototype.fstatSync = function (fd) {
  return utils.invoke(this.base.fstat, [fd], function (error) {
    if (error.code === 'fd:type') {
      throw new TypeError('fd must be a file descriptor');
    }

    return errors[error.code]({syscall: 'fstat'});
  });
};

VirtualFS.prototype.fsyncSync = function (fd) {
  return utils.invoke(this.base.fsync, [fd], function (error) {
    if (error.code === 'fd:type') {
      throw new TypeError('fd must be a file descriptor');
    }

    return errors[error.code]({syscall: 'fsync'});
  });
};

VirtualFS.prototype.ftruncateSync = function (fd, length) {
  return utils.invoke(this.base.ftruncate, [fd, length], function (error) {
    if (error.code === 'fd:type') {
      throw new TypeError('fd must be a file descriptor');
    }

    if (error.code === 'length:type') {
      throw new TypeError('Not an integer');
    }

    return errors[error.code]({syscall: 'ftruncate'});
  });
};

VirtualFS.prototype.futimesSync = function (fd, atime, mtime) {
  return utils.invoke(this.base.futimes, [fd, atime, mtime], function (error) {
    if (error.code === 'fd:type') {
      throw new TypeError('fd must be an int');
    }

    if (error.code === 'atime:type') {
      throw new Error('Cannot parse time: ' + atime);
    }

    if (error.code === 'mtime:type') {
      throw new Error('Cannot parse time: ' + mtime);
    }

    return errors[error.code]({syscall: 'futime'});
  });
};

VirtualFS.prototype.lchmodSync = function (path, mode) {
  errors.nullCheck(path);

  return utils.invoke(this.base.lchmod, [path, mode], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    if (error.code === 'mode:type') {
      throw new TypeError('mode must be an integer');
    }

    return errors[error.code]({syscall: 'chmod', path: path});
  });
};

VirtualFS.prototype.lchownSync = function (path, uid, gid) {
  errors.nullCheck(path);

  return utils.invoke(this.base.lchown, [path, uid, gid], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    if (error.code === 'uid:type') {
      throw new TypeError('uid must be an unsigned int');
    }

    if (error.code === 'gid:type') {
      throw new TypeError('gid must be an unsigned int');
    }

    return errors[error.code]({syscall: 'chown', path: path});
  });
};

VirtualFS.prototype.linkSync = function (srcpath, dstpath) {
  errors.nullCheck(srcpath);
  errors.nullCheck(dstpath);

  return utils.invoke(this.base.link, [srcpath, dstpath], function (error) {
    if (error.code === 'srcpath:type') {
      throw new TypeError('dest path must be a string');
    }

    if (error.code === 'dstpath:type') {
      throw new TypeError('src path must be a string');
    }

    return errors[error.code]({syscall: 'link', path: srcpath, dest: dstpath});
  });
};

VirtualFS.prototype.lstatSync = function (path) {
  errors.nullCheck(path);

  return utils.invoke(this.base.lstat, [path], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    return errors[error.code]({syscall: 'lstat', path: path});
  });
};

VirtualFS.prototype.mkdirSync = function (path, mode) {
  errors.nullCheck(path);

  return utils.invoke(this.base.mkdir, [path, mode], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    return errors[error.code]({syscall: 'mkdir', path: path});
  });
};

VirtualFS.prototype.mkdtemp = function (prefix, callback) {
  if (typeof callback !== 'function') {
    throw new TypeError('"callback" argument must be a function');
  }

  if (!errors.nullCheck(prefix, callback)) {
    return;
  }

  process.nextTick(function () {
    try {
      return callback(null, utils.invoke(this.base.mkdtemp, [prefix], function (error) {
        return errors[error.code]({syscall: 'mkdtemp', path: error.path});
      }));
    } catch (error) {
      return callback(error);
    }
  }.bind(this));
};

VirtualFS.prototype.mkdtempSync = function (prefix) {
  errors.nullCheck(prefix);

  return utils.invoke(this.base.mkdtemp, [prefix], function (error) {
    return errors[error.code]({syscall: 'mkdtemp', path: prefix + 'XXXXXX'});
  });
};

VirtualFS.prototype.openSync = function (path, flags, mode) {
  errors.nullCheck(path);

  return utils.invoke(this.base.open, [path, flags, mode], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    if (error.code === 'flags:type') {
      throw new TypeError('flags must be an int');
    }

    return errors[error.code]({syscall: 'open', path: path});
  });
};

VirtualFS.prototype.readdirSync = function (path) {
  errors.nullCheck(path);

  return utils.invoke(this.base.readdir, [path], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    return errors[error.code]({syscall: 'scandir', path: path});
  });
};

VirtualFS.prototype.readFileSync = function (file, options) {
  errors.nullCheck(file);

  return utils.invoke(this.base.readFile, [file, options], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    if (error.code === 'options:type') {
      throw new TypeError('Expected options to be either an object or a string, but got ' + error.type + ' instead');
    }

    if (error.code === 'options:encoding') {
      throw new Error('Unknown encoding: ' + error.encoding);
    }

    if (error.code === 'EISDIR') {
      return errors.EISDIR({syscall: 'read'});
    }

    return errors[error.code]({syscall: 'open', path: file});
  });
};

VirtualFS.prototype.readlinkSync = function (path) {
  errors.nullCheck(path);

  return utils.invoke(this.base.readlink, [path], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    return errors[error.code]({syscall: 'readlink', path: path});
  });
};

VirtualFS.prototype.readSync = function (fd, buffer, offset, length, position) {
  return utils.invoke(this.base.read, [fd, buffer, offset, length, position], function (error) {
    if (error.code === 'fd:type') {
      throw new TypeError('fd must be a file descriptor');
    }

    if (error.code === 'offset:size') {
      throw new Error('Offset is out of bounds');
    }

    if (error.code === 'length:size') {
      throw new RangeError('Length extends beyond buffer');
    }

    return errors[error.code]({syscall: 'read'});
  });
};

VirtualFS.prototype.realpathSync = function (path, cache) {
  errors.nullCheck(path);

  return utils.invoke(this.base.realpath, [path, cache], function (error) {
    return errors[error.code]({syscall: 'lstat', path: path});
  });
};

VirtualFS.prototype.renameSync = function (oldPath, newPath) {
  errors.nullCheck(oldPath);
  errors.nullCheck(newPath);

  return utils.invoke(this.base.rename, [oldPath, newPath], function (error) {
    if (error.code === 'old:type') {
      throw new TypeError('old path must be a string');
    }

    if (error.code === 'new:type') {
      throw new TypeError('new path must be a string');
    }

    return errors[error.code]({syscall: 'rename', path: oldPath, dest: newPath});
  });
};

VirtualFS.prototype.rmdirSync = function (path) {
  errors.nullCheck(path);

  return utils.invoke(this.base.rmdir, [path], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    return errors[error.code]({syscall: 'rmdir', path: path});
  });
};

VirtualFS.prototype.statSync = function (path) {
  errors.nullCheck(path);

  return utils.invoke(this.base.stat, [path], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    return errors[error.code]({syscall: 'stat', path: path});
  });
};

VirtualFS.prototype.symlinkSync = function (target, path) {
  errors.nullCheck(target);
  errors.nullCheck(path);

  return utils.invoke(this.base.symlink, [target, path], function (error) {
    if (error.code === 'srcpath:type') {
      throw new TypeError('target path must be a string');
    }

    if (error.code === 'dstpath:type') {
      throw new TypeError('src path must be a string');
    }

    return errors[error.code]({syscall: 'symlink', path: target, dest: path});
  });
};

VirtualFS.prototype.truncateSync = function (path, length) {
  errors.nullCheck(path);

  return utils.invoke(this.base.truncate, [path, length], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    if (error.code === 'length:type') {
      throw new TypeError('Not an integer');
    }

    return errors[error.code]({syscall: 'open', path: path});
  });
};

VirtualFS.prototype.unlinkSync = function (path) {
  errors.nullCheck(path);

  return utils.invoke(this.base.unlink, [path], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    return errors[error.code]({syscall: 'unlink', path: path});
  });
};

VirtualFS.prototype.utimesSync = function (path, atime, mtime) {
  errors.nullCheck(path);

  return utils.invoke(this.base.utimes, [path, atime, mtime], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    if (error.code === 'atime:type') {
      throw new Error('Cannot parse time: ' + atime);
    }

    if (error.code === 'mtime:type') {
      throw new Error('Cannot parse time: ' + mtime);
    }

    return errors[error.code]({syscall: 'utime', path: path});
  });
};

VirtualFS.prototype.writeFileSync = function (file, data, options) {
  errors.nullCheck(file);

  return utils.invoke(this.base.writeFile, [file, data, options], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    if (error.code === 'options:type') {
      throw new TypeError('Expected options to be either an object or a string, but got ' + error.type + ' instead');
    }

    if (error.code === 'options:encoding') {
      throw new Error('Unknown encoding: ' + error.encoding);
    }

    return errors[error.code]({syscall: 'open', path: file});
  });
};

VirtualFS.prototype.writeSync = function (fd, buffer, offset, length, position) {
  return utils.invoke(this.base.write, [fd, buffer, offset, length, position], function (error) {
    if (error.code === 'fd:type') {
      throw new TypeError('First argument must be file descriptor');
    }

    if (error.code === 'offset:size') {
      throw new RangeError('offset out of bounds');
    }

    if (error.code === 'length:size') {
      throw new RangeError('length out of bounds');
    }

    return errors[error.code]({syscall: 'write'});
  });
};

// Watchers

VirtualFS.prototype.watch = function (filename, options, listener) {
  errors.nullCheck(filename);

  return this.base.watch(filename, options, listener);
};

VirtualFS.prototype.watchFile = function (filename, options, listener) {
  errors.nullCheck(filename);

  return utils.invoke(this.base.watchFile, [filename, options, listener], function () {
    throw new Error('watchFile requires a listener function');
  });
};

VirtualFS.prototype.unwatchFile = function (filename, listener) {
  errors.nullCheck(filename);

  return this.base.unwatchFile(filename, listener);
};

// Internals

VirtualFS.prototype._toUnixTimestamp = function (time) {
  return this.base.toUnixTimestamp(time);
};

module.exports = VirtualFS;
