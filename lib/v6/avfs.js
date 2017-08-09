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

var rethrow = function (error) {
  if (error) {
    throw error;
  }
};

var stringify = function (path) {
  return Buffer.isBuffer(path) ? path.toString() : path;
};

var parse = function (options) {
  if (!options) {
    return null;
  }

  if (typeof options === 'string') {
    return options;
  }

  if (typeof options === 'object') {
    return options.encoding || null;
  }

  throw new TypeError('"options" must be a string or an object');
};

var bufferize = function (path, encoding) {
  if (!encoding) {
    return path;
  }

  var buffer = Buffer.from(path);

  return (encoding === 'buffer') ? buffer : buffer.toString(encoding);
};

function VirtualFS() {
  var storage = new Storage(constants);

  var handles = {
    next: 0
  };

  var base = assign({},
    require('../base/access')(storage, constants),
    require('../base/attributes')(storage, constants),
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

  this.Stats = factories.stats(constants);

  this.ReadStream  = factories.readStream(this);
  this.WriteStream = factories.writeStream(this);

  this.FileReadStream  = this.ReadStream;
  this.FileWriteStream = this.WriteStream;

  // Asynchronous methods

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
  path = stringify(path);

  errors.nullCheck(path);

  return utils.invoke(this.base.access, [path, mode], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string or Buffer');
    }

    return errors[error.code]({syscall: 'access', path: path});
  });
};

VirtualFS.prototype.appendFileSync = function (file, data, options) {
  file = stringify(file);

  errors.nullCheck(file);

  return utils.invoke(this.base.appendFile, [file, data, options], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string or Buffer');
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
  path = stringify(path);

  errors.nullCheck(path);

  return utils.invoke(this.base.chmod, [path, mode], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string or Buffer');
    }

    if (error.code === 'mode:type') {
      throw new TypeError('mode must be an integer');
    }

    return errors[error.code]({syscall: 'chmod', path: error.path || path});
  });
};

VirtualFS.prototype.chownSync = function (path, uid, gid) {
  path = stringify(path);

  errors.nullCheck(path);

  return utils.invoke(this.base.chown, [path, uid, gid], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string or Buffer');
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
  return this.ReadStream(stringify(path), options);
};

VirtualFS.prototype.createWriteStream = function (path, options) {
  return this.WriteStream(stringify(path), options);
};

VirtualFS.prototype.existsSync = function (path) {
  return this.base.exists(stringify(path));
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
  path = stringify(path);

  errors.nullCheck(path);

  return utils.invoke(this.base.lchmod, [path, mode], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string or Buffer');
    }

    if (error.code === 'mode:type') {
      throw new TypeError('mode must be an integer');
    }

    return errors[error.code]({syscall: 'chmod', path: path});
  });
};

VirtualFS.prototype.lchownSync = function (path, uid, gid) {
  path = stringify(path);

  errors.nullCheck(path);

  return utils.invoke(this.base.lchown, [path, uid, gid], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string or Buffer');
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
  srcpath = stringify(srcpath);
  dstpath = stringify(dstpath);

  errors.nullCheck(srcpath);
  errors.nullCheck(dstpath);

  return utils.invoke(this.base.link, [srcpath, dstpath], function (error) {
    if (error.code === 'srcpath:type') {
      throw new TypeError('src must be a string or Buffer');
    }

    if (error.code === 'dstpath:type') {
      throw new TypeError('dest must be a string or Buffer');
    }

    return errors[error.code]({syscall: 'link', path: srcpath, dest: dstpath});
  });
};

VirtualFS.prototype.lstatSync = function (path) {
  path = stringify(path);

  errors.nullCheck(path);

  return utils.invoke(this.base.lstat, [path], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string or Buffer');
    }

    return errors[error.code]({syscall: 'lstat', path: path});
  });
};

VirtualFS.prototype.mkdirSync = function (path, mode) {
  path = stringify(path);

  errors.nullCheck(path);

  return utils.invoke(this.base.mkdir, [path, mode], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string or Buffer');
    }

    return errors[error.code]({syscall: 'mkdir', path: path});
  });
};

VirtualFS.prototype.mkdtemp = function (prefix, options, callback) {
  if (typeof options === 'function') {
    callback = options;
    options  = {};
  }

  var cb = (typeof callback !== 'function') ? rethrow : callback;

  if (!errors.nullCheck(prefix, cb)) {
    return;
  }

  process.nextTick(function () {
    try {
      return cb(null, utils.invoke(this.base.mkdtemp, [prefix, options], function (error) {
        return errors[error.code]({syscall: 'mkdtemp', path: error.path});
      }));
    } catch (error) {
      return cb(error);
    }
  }.bind(this));
};

VirtualFS.prototype.mkdtempSync = function (prefix, options) {
  errors.nullCheck(prefix);

  var encoding = parse(options);

  return bufferize(utils.invoke(this.base.mkdtemp, [prefix], function (error) {
    return errors[error.code]({syscall: 'mkdtemp', path: prefix + 'XXXXXX'});
  }), encoding);
};

VirtualFS.prototype.openSync = function (path, flags, mode) {
  path = stringify(path);

  errors.nullCheck(path);

  return utils.invoke(this.base.open, [path, flags, mode], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string or Buffer');
    }

    if (error.code === 'flags:type') {
      throw new Error('Unknown file open flag: ' + error.value);
    }

    return errors[error.code]({syscall: 'open', path: path});
  });
};

VirtualFS.prototype.readdirSync = function (path, options) {
  path = stringify(path);

  errors.nullCheck(path);

  var encoding = parse(options);

  var result = utils.invoke(this.base.readdir, [path], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string or Buffer');
    }

    return errors[error.code]({syscall: 'scandir', path: path});
  });

  if (!Array.isArray(result)) {
    return result;
  }

  return result.map(function (file) {
    return bufferize(file, encoding);
  });
};

VirtualFS.prototype.readFileSync = function (file, options) {
  file = stringify(file);

  errors.nullCheck(file);

  return utils.invoke(this.base.readFile, [file, options], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string or Buffer');
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

VirtualFS.prototype.readlinkSync = function (path, options) {
  path = stringify(path);

  errors.nullCheck(path);

  var encoding = parse(options);

  return bufferize(utils.invoke(this.base.readlink, [path], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string or Buffer');
    }

    return errors[error.code]({syscall: 'readlink', path: path});
  }), encoding);
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

VirtualFS.prototype.realpathSync = function (path, options) {
  path = stringify(path);

  errors.nullCheck(path);

  var encoding = parse(options);

  if (encoding && encoding !== 'buffer' && !Buffer.isEncoding(encoding)) {
    throw new TypeError('Unknown encoding: ' + encoding);
  }

  return bufferize(utils.invoke(this.base.realpath, [path], function (error) {
    return errors[error.code]({syscall: 'lstat', path: path});
  }), encoding);
};

VirtualFS.prototype.renameSync = function (oldPath, newPath) {
  oldPath = stringify(oldPath);
  newPath = stringify(newPath);

  errors.nullCheck(oldPath);
  errors.nullCheck(newPath);

  return utils.invoke(this.base.rename, [oldPath, newPath], function (error) {
    if (error.code === 'old:type') {
      throw new TypeError('old_path must be a string or Buffer');
    }

    if (error.code === 'new:type') {
      throw new TypeError('new_path must be a string or Buffer');
    }

    return errors[error.code]({syscall: 'rename', path: oldPath, dest: newPath});
  });
};

VirtualFS.prototype.rmdirSync = function (path) {
  path = stringify(path);

  errors.nullCheck(path);

  return utils.invoke(this.base.rmdir, [path], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string or Buffer');
    }

    return errors[error.code]({syscall: 'rmdir', path: path});
  });
};

VirtualFS.prototype.statSync = function (path) {
  path = stringify(path);

  errors.nullCheck(path);

  return utils.invoke(this.base.stat, [path], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string or Buffer');
    }

    return errors[error.code]({syscall: 'stat', path: path});
  });
};

VirtualFS.prototype.symlinkSync = function (target, path) {
  target = stringify(target);
  path   = stringify(path);

  errors.nullCheck(target);
  errors.nullCheck(path);

  return utils.invoke(this.base.symlink, [target, path], function (error) {
    if (error.code === 'srcpath:type') {
      throw new TypeError('target must be a string or Buffer');
    }

    if (error.code === 'dstpath:type') {
      throw new TypeError('path must be a string or Buffer');
    }

    return errors[error.code]({syscall: 'symlink', path: target, dest: path});
  });
};

VirtualFS.prototype.truncateSync = function (path, length) {
  path = stringify(path);

  errors.nullCheck(path);

  return utils.invoke(this.base.truncate, [path, length], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string or Buffer');
    }

    if (error.code === 'length:type') {
      throw new TypeError('Not an integer');
    }

    return errors[error.code]({syscall: 'open', path: path});
  });
};

VirtualFS.prototype.unlinkSync = function (path) {
  path = stringify(path);

  errors.nullCheck(path);

  return utils.invoke(this.base.unlink, [path], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string or Buffer');
    }

    return errors[error.code]({syscall: 'unlink', path: path});
  });
};

VirtualFS.prototype.utimesSync = function (path, atime, mtime) {
  path = stringify(path);

  errors.nullCheck(path);

  return utils.invoke(this.base.utimes, [path, atime, mtime], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string or Buffer');
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
  file = stringify(file);

  errors.nullCheck(file);

  return utils.invoke(this.base.writeFile, [file, data, options], function (error) {
    if (error.code === 'path:type') {
      throw new TypeError('path must be a string or Buffer');
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
  filename = stringify(filename);

  errors.nullCheck(filename);

  return this.base.watch(filename, options, listener);
};

VirtualFS.prototype.watchFile = function (filename, options, listener) {
  filename = stringify(filename);

  errors.nullCheck(filename);

  return utils.invoke(this.base.watchFile, [filename, options, listener], function () {
    throw new Error('"watchFile()" requires a listener function');
  });
};

VirtualFS.prototype.unwatchFile = function (filename, listener) {
  filename = stringify(filename);

  errors.nullCheck(filename);

  return this.base.unwatchFile(filename, listener);
};

// Internals

VirtualFS.prototype._toUnixTimestamp = function (time) {
  return this.base.toUnixTimestamp(time);
};

module.exports = VirtualFS;
