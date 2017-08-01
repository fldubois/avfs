'use strict';

var assign = require('object-assign');

var constants = require('./constants');
var errors    = require('./errors')(constants);

var utils     = require('../common/utils');

var Storage = require('../common/storage');

var factories = {
  stats:       require('../common/components/stats'),
  readStream:  require('../common/streams/read-stream'),
  writeStream: require('../common/streams/write-stream')
};

function VirtualFS() {
  var storage = new Storage(constants);

  var handles = {
    next: 0
  };

  var base = assign({},
    require('../common/avfs/access')(storage, constants),
    require('../common/avfs/attributes')(storage, constants),
    require('../common/avfs/descriptors')(storage, constants, handles),
    require('../common/avfs/directories')(storage, constants),
    require('../common/avfs/exists')(storage),
    require('../common/avfs/files')(storage, constants, handles),
    require('../common/avfs/links')(storage, constants),
    require('../common/avfs/permissions')(storage, constants),
    require('../common/avfs/read-write')(storage, constants, handles),
    require('../common/avfs/utils')(),
    require('../common/avfs/watchers')()
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

  this.Stats = factories.stats(constants);

  this.ReadStream  = factories.readStream(this);
  this.WriteStream = factories.writeStream(this);

  this.FileReadStream  = this.ReadStream;
  this.FileWriteStream = this.WriteStream;

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

  if (typeof path !== 'string') {
    throw new TypeError('path must be a string');
  }

  return utils.invoke(this.base.access, [path, mode], function (error) {
    return errors[error.code]({syscall: 'access', path: path});
  });
};

VirtualFS.prototype.appendFileSync = function (filename, data, options) {
  if (typeof filename !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (options && ['string', 'object'].indexOf(typeof options) === -1) {
    var type = typeof options;

    throw new TypeError('Expected options to be either an object or a string, but got ' + type + ' instead');
  }

  var encoding = (typeof options === 'object') ? options.encoding : options;

  if (encoding && !Buffer.isEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }

  return utils.invoke(this.base.appendFile, [filename, data, options], function (error) {
    return errors[error.code]({syscall: 'open', path: error.path || filename});
  });
};

VirtualFS.prototype.chmodSync = function (filepath, mode) {
  errors.nullCheck(filepath);

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (typeof mode !== 'string' && typeof mode !== 'number') {
    throw new TypeError('mode must be an integer');
  }

  return utils.invoke(this.base.chmod, [filepath, mode], function (error) {
    return errors[error.code]({syscall: 'chmod', path: error.path || filepath});
  });
};

VirtualFS.prototype.chownSync = function (filepath, uid, gid) {
  errors.nullCheck(filepath);

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (typeof uid !== 'number' || uid < 0) {
    throw new TypeError('uid must be an unsigned int');
  }

  if (typeof gid !== 'number' || gid < 0) {
    throw new TypeError('gid must be an unsigned int');
  }

  return utils.invoke(this.base.chown, [filepath, uid, gid], function (error) {
    return errors[error.code]({syscall: 'chown', path: filepath});
  });
};

VirtualFS.prototype.closeSync = function (fd) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('fd must be a file descriptor');
  }

  return utils.invoke(this.base.close, [fd], function (error) {
    return errors[error.code]({syscall: 'close'});
  });
};

VirtualFS.prototype.createReadStream = function (filename, options) {
  return this.ReadStream(filename, options);
};

VirtualFS.prototype.createWriteStream = function (filename, options) {
  return this.WriteStream(filename, options);
};

VirtualFS.prototype.existsSync = function (filepath) {
  return this.base.exists(filepath);
};

VirtualFS.prototype.fchmodSync = function (fd, mode) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('fd must be a file descriptor');
  }

  if (typeof mode !== 'string' && typeof mode !== 'number') {
    throw new TypeError('mode must be an integer');
  }

  return utils.invoke(this.base.fchmod, [fd, mode], function (error) {
    return errors[error.code]({syscall: 'fchmod'});
  });
};

VirtualFS.prototype.fchownSync = function (fd, uid, gid) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('fd must be an int');
  }

  if (typeof uid !== 'number' || uid < 0) {
    throw new TypeError('uid must be an unsigned int');
  }

  if (typeof gid !== 'number' || gid < 0) {
    throw new TypeError('gid must be an unsigned int');
  }

  return utils.invoke(this.base.fchown, [fd, uid, gid], function (error) {
    return errors[error.code]({syscall: 'fchown'});
  });
};

VirtualFS.prototype.fdatasyncSync = function (fd) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('fd must be a file descriptor');
  }

  return utils.invoke(this.base.fdatasync, [fd], function (error) {
    return errors[error.code]({syscall: 'fdatasync'});
  });
};

VirtualFS.prototype.fstatSync = function (fd) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('fd must be a file descriptor');
  }

  return utils.invoke(this.base.fstat, [fd], function (error) {
    return errors[error.code]({syscall: 'fstat'});
  });
};

VirtualFS.prototype.fsyncSync = function (fd) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('fd must be a file descriptor');
  }

  return utils.invoke(this.base.fsync, [fd], function (error) {
    return errors[error.code]({syscall: 'fsync'});
  });
};

VirtualFS.prototype.ftruncateSync = function (fd, length) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('fd must be a file descriptor');
  }

  if (typeof length !== 'undefined' && length !== parseInt(length, 10)) {
    throw new TypeError('Not an integer');
  }

  return utils.invoke(this.base.ftruncate, [fd, length], function (error) {
    return errors[error.code]({syscall: 'ftruncate'});
  });
};

VirtualFS.prototype.futimesSync = function (fd, atime, mtime) {
  if (typeof atime !== 'number' && !(atime instanceof Date)) {
    throw new Error('Cannot parse time: ' + atime);
  }

  if (typeof mtime !== 'number' && !(mtime instanceof Date)) {
    throw new Error('Cannot parse time: ' + mtime);
  }

  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('fd must be an int');
  }

  return utils.invoke(this.base.futimes, [fd, atime, mtime], function (error) {
    return errors[error.code]({syscall: 'futime'});
  });
};

VirtualFS.prototype.lchmodSync = function (filepath, mode) {
  if (typeof filepath !== 'string') {
    throw new TypeError('Bad argument');
  }

  if (typeof mode !== 'string' && typeof mode !== 'number') {
    throw new TypeError('Bad argument');
  }

  return utils.invoke(this.base.lchmod, [filepath, mode], function (error) {
    return errors[error.code]({syscall: 'chmod', path: filepath});
  });
};

VirtualFS.prototype.lchownSync = function (filepath, uid, gid) {
  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (typeof uid !== 'number' || uid < 0) {
    throw new TypeError('uid must be an unsigned int');
  }

  if (typeof gid !== 'number' || gid < 0) {
    throw new TypeError('gid must be an unsigned int');
  }

  return utils.invoke(this.base.lchown, [filepath, uid, gid], function (error) {
    return errors[error.code]({syscall: 'chown', path: filepath});
  });
};

VirtualFS.prototype.linkSync = function (srcpath, dstpath) {
  errors.nullCheck(srcpath);
  errors.nullCheck(dstpath);

  if (typeof srcpath !== 'string') {
    throw new TypeError('dest path must be a string');
  }

  if (typeof dstpath !== 'string') {
    throw new TypeError('src path must be a string');
  }

  return utils.invoke(this.base.link, [srcpath, dstpath], function (error) {
    return errors[error.code]({syscall: 'link', path: srcpath, dest: dstpath});
  });
};

VirtualFS.prototype.lstatSync = function (filepath) {
  errors.nullCheck(filepath);

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  return utils.invoke(this.base.lstat, [filepath], function (error) {
    return errors[error.code]({syscall: 'lstat', path: filepath});
  });
};

VirtualFS.prototype.mkdirSync = function (filepath, mode) {
  errors.nullCheck(filepath);

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  return utils.invoke(this.base.mkdir, [filepath, mode], function (error) {
    return errors[error.code]({syscall: 'mkdir', path: filepath});
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

VirtualFS.prototype.openSync = function (filepath, flags, mode) {
  errors.nullCheck(filepath);

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  return utils.invoke(this.base.open, [filepath, flags, mode], function (error) {
    if (error.code === 'flags:type') {
      throw new TypeError('flags must be an int');
    }

    return errors[error.code]({syscall: 'open', path: filepath});
  });
};

VirtualFS.prototype.readdirSync = function (filepath) {
  errors.nullCheck(filepath);

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  return utils.invoke(this.base.readdir, [filepath], function (error) {
    return errors[error.code]({syscall: 'scandir', path: filepath});
  });
};

VirtualFS.prototype.readFileSync = function (filename, options) {
  if (typeof filename !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (options && ['string', 'object'].indexOf(typeof options) === -1) {
    var type = typeof options;

    throw new TypeError('Expected options to be either an object or a string, but got ' + type + ' instead');
  }

  var encoding = (typeof options === 'object') ? options.encoding : options;

  if (encoding && !Buffer.isEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }

  return utils.invoke(this.base.readFile, [filename, options], function (error) {
    if (error.code === 'EISDIR') {
      return errors.EISDIR({syscall: 'read'});
    }

    return errors[error.code]({syscall: 'open', path: filename});
  });
};

VirtualFS.prototype.readlinkSync = function (linkpath) {
  errors.nullCheck(linkpath);

  if (typeof linkpath !== 'string') {
    throw new TypeError('path must be a string');
  }

  return utils.invoke(this.base.readlink, [linkpath], function (error) {
    return errors[error.code]({syscall: 'readlink', path: linkpath});
  });
};

VirtualFS.prototype.readSync = function (fd, buffer, offset, length, position) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('fd must be a file descriptor');
  }

  if (offset > buffer.length) {
    throw new Error('Offset is out of bounds');
  }

  if ((offset + length) > buffer.length) {
    throw new RangeError('Length extends beyond buffer');
  }

  return utils.invoke(this.base.read, [fd, buffer, offset, length, position], function (error) {
    return errors[error.code]({syscall: 'read'});
  });
};

VirtualFS.prototype.realpathSync = function (filepath, cache) {
  return utils.invoke(this.base.realpath, [filepath, cache], function (error) {
    return errors[error.code]({syscall: 'lstat', path: filepath});
  });
};

VirtualFS.prototype.renameSync = function (oldPath, newPath) {
  errors.nullCheck(oldPath);
  errors.nullCheck(newPath);

  if (typeof oldPath !== 'string') {
    throw new TypeError('old path must be a string');
  }

  if (typeof newPath !== 'string') {
    throw new TypeError('new path must be a string');
  }

  return utils.invoke(this.base.rename, [oldPath, newPath], function (error) {
    return errors[error.code]({syscall: 'rename', path: oldPath, dest: newPath});
  });
};

VirtualFS.prototype.rmdirSync = function (filepath) {
  errors.nullCheck(filepath);

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  return utils.invoke(this.base.rmdir, [filepath], function (error) {
    return errors[error.code]({syscall: 'rmdir', path: filepath});
  });
};

VirtualFS.prototype.statSync = function (filepath) {
  errors.nullCheck(filepath);

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  return utils.invoke(this.base.stat, [filepath], function (error) {
    return errors[error.code]({syscall: 'stat', path: filepath});
  });
};

VirtualFS.prototype.symlinkSync = function (srcpath, dstpath) {
  errors.nullCheck(srcpath);
  errors.nullCheck(dstpath);

  if (typeof srcpath !== 'string') {
    throw new TypeError('target path must be a string');
  }

  if (typeof dstpath !== 'string') {
    throw new TypeError('src path must be a string');
  }

  return utils.invoke(this.base.symlink, [srcpath, dstpath], function (error) {
    return errors[error.code]({syscall: 'symlink', path: srcpath, dest: dstpath});
  });
};

VirtualFS.prototype.truncateSync = function (filepath, length) {
  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (typeof length !== 'undefined' && length !== parseInt(length, 10)) {
    throw new TypeError('Not an integer');
  }

  return utils.invoke(this.base.truncate, [filepath, length], function (error) {
    return errors[error.code]({syscall: 'open', path: filepath});
  });
};

VirtualFS.prototype.unlinkSync = function (filepath) {
  errors.nullCheck(filepath);

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  return utils.invoke(this.base.unlink, [filepath], function (error) {
    return errors[error.code]({syscall: 'unlink', path: filepath});
  });
};

VirtualFS.prototype.utimesSync = function (filepath, atime, mtime) {
  errors.nullCheck(filepath);

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (typeof atime !== 'number' && !(atime instanceof Date)) {
    throw new Error('Cannot parse time: ' + atime);
  }

  if (typeof mtime !== 'number' && !(mtime instanceof Date)) {
    throw new Error('Cannot parse time: ' + mtime);
  }

  return utils.invoke(this.base.utimes, [filepath, atime, mtime], function (error) {
    return errors[error.code]({syscall: 'utime', path: filepath});
  });
};

VirtualFS.prototype.writeFileSync = function (filename, data, options) {
  if (typeof filename !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (options && ['string', 'object'].indexOf(typeof options) === -1) {
    var type = typeof options;

    throw new TypeError('Expected options to be either an object or a string, but got ' + type + ' instead');
  }

  var encoding = (typeof options === 'object') ? options.encoding : options;

  if (encoding && !Buffer.isEncoding(encoding)) {
    throw new Error('Unknown encoding: ' + encoding);
  }

  return utils.invoke(this.base.writeFile, [filename, data, options], function (error) {
    return errors[error.code]({syscall: 'open', path: filename});
  });
};

VirtualFS.prototype.writeSync = function (fd, buffer, offset, length, position) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('First argument must be file descriptor');
  }

  if (Buffer.isBuffer(buffer)) {
    if (offset > buffer.length) {
      throw new RangeError('offset out of bounds');
    }

    if ((offset + length) > buffer.length) {
      throw new RangeError('length out of bounds');
    }
  }

  return utils.invoke(this.base.write, [fd, buffer, offset, length, position], function (error) {
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
