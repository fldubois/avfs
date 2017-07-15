'use strict';

var assign = require('object-assign');

var constants = require('../common/constants');
var errors    = require('../common/errors');
var utils     = require('../common/utils');

var Storage = require('../common/storage');

var Stats = require('../common/components/stats');

var ReadStream  = require('../common/streams/read-stream');
var WriteStream = require('../common/streams/write-stream');

var SyncWriteStream = require('../common/streams/sync-write-stream');

var nocb = function (error) {
  if (error) {
    console.error('fs: missing callback ' + error.message);
  }
};

function VirtualFS() {
  var storage = new Storage();

  var handles = {
    next: 0
  };

  var base = assign({},
    require('../common/avfs/access')(storage, constants),
    require('../common/avfs/attributes')(storage),
    require('../common/avfs/descriptors')(storage, constants, handles),
    require('../common/avfs/directories')(storage, constants),
    require('../common/avfs/exists')(storage),
    require('../common/avfs/files')(storage, constants, handles),
    require('../common/avfs/links')(storage, constants),
    require('../common/avfs/permissions')(storage),
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

  this.ReadStream  = ReadStream.bind(null, this);
  this.WriteStream = WriteStream.bind(null, this);

  this.FileReadStream  = this.ReadStream;
  this.FileWriteStream = this.WriteStream;

  this.SyncWriteStream = SyncWriteStream.bind(null, this);

  // Asynchronous methods

  utils.asyncify(this, nocb);
}

VirtualFS.prototype.Stats = Stats;

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
    throw errors.args.options(options);
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
    throw errors.args.path();
  }

  if (typeof mode !== 'string' && typeof mode !== 'number') {
    throw errors.args.mode();
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
    throw errors.args.fd();
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
    throw errors.args.fd();
  }

  if (typeof mode !== 'string' && typeof mode !== 'number') {
    throw errors.args.mode();
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
    throw errors.args.fd();
  }

  return utils.invoke(this.base.fdatasync, [fd], function (error) {
    return errors[error.code]({syscall: 'fdatasync'});
  });
};

VirtualFS.prototype.fstatSync = function (fd) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw errors.args.fd();
  }

  return utils.invoke(this.base.fstat, [fd], function (error) {
    return errors[error.code]({syscall: 'fstat'});
  });
};

VirtualFS.prototype.fsyncSync = function (fd) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw errors.args.fd();
  }

  return utils.invoke(this.base.fsync, [fd], function (error) {
    return errors[error.code]({syscall: 'fsync'});
  });
};

VirtualFS.prototype.ftruncateSync = function (fd, length) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw errors.args.fd();
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
    var path = (['ENOENT', 'ENOTDIR'].indexOf(error.code) !== -1) ? srcpath : dstpath;

    return errors[error.code]({syscall: 'link', path: path});
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
    throw errors.args.path();
  }

  return utils.invoke(this.base.mkdir, [filepath, mode], function (error) {
    return errors[error.code]({syscall: 'mkdir', path: filepath});
  });
};

VirtualFS.prototype.openSync = function (filepath, flags, mode) {
  errors.nullCheck(filepath);

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  return utils.invoke(this.base.open, [filepath, flags, mode], function (error) {
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
    throw errors.args.options(options);
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
    throw errors.args.fd();
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
    return errors[error.code]({syscall: 'rename', path: oldPath});
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

// TODO: type parameter support
VirtualFS.prototype.symlinkSync = function (srcpath, dstpath) {
  errors.nullCheck(srcpath);
  errors.nullCheck(dstpath);

  if (typeof srcpath !== 'string') {
    throw new TypeError('dest path must be a string');
  }

  if (typeof dstpath !== 'string') {
    throw new TypeError('src path must be a string');
  }

  return utils.invoke(this.base.symlink, [srcpath, dstpath], function (error) {
    var path = (error.code === 'EEXIST') ? dstpath : srcpath;

    return errors[error.code]({syscall: 'symlink', path: path});
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
    throw errors.args.options(options);
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
    throw errors.write.args.fd();
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

// Asynchronous read and write

VirtualFS.prototype.read = function (fd, buffer, offset, length, position, callback) {
  var bytesRead = void 0;
  var error     = null;

  try {
    bytesRead = this.readSync(fd, buffer, offset, length, position);
  } catch (err) {
    error = err;
  }

  if (error instanceof Error && !(/^E[A-Z]+/.test(error.code))) {
    throw error;
  }

  if (typeof callback === 'function') {
    setImmediate(function () {
      if (error) {
        error = errors[error.code]('read');
      }

      return callback(error, bytesRead || 0, buffer);
    });
  }
};

VirtualFS.prototype.write = function (fd, buffer, offset, length, position, callback) {
  // fs.write(fd, data[, position[, encoding]], callback);
  if (!Buffer.isBuffer(buffer)) {
    if (typeof offset === 'function') {
      callback = offset;
      offset   = void 0;
      length   = void 0;
    } else if (typeof length === 'function') {
      callback = length;
      length   = void 0;
    } else if (typeof position === 'function') {
      callback = position;
    }

    position = void 0;
  } else if (!length) {
    if (typeof callback === 'function') {
      setImmediate(function () {
        callback(null, 0);
      });
    }

    return;
  }

  if (typeof callback !== 'function') {
    callback = nocb;
  }

  var written = void 0;
  var error   = null;

  try {
    written = this.writeSync(fd, buffer, offset, length, position);
  } catch (err) {
    error = err;
  }

  if (error instanceof Error && !(/^E[A-Z]+/.test(error.code))) {
    throw error;
  }

  setImmediate(function () {
    if (error) {
      error = errors[error.code]('write');
    }

    return callback(error, written || 0, buffer);
  });
};

// Watchers

VirtualFS.prototype.watch = function (filename, options, listener) {
  errors.nullCheck(filename);

  return this.base.watch(filename, options, listener);
};

VirtualFS.prototype.watchFile = function (filename, options, listener) {
  errors.nullCheck(filename);

  return this.base.watchFile(filename, options, listener);
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
