'use strict';

var constants = require('constants');

var assign = require('object-assign');

var parsers = require('../common/parsers')(constants);
var utils   = require('../common/utils');

var Storage = require('../common/storage');

var codes = utils.map(utils.filter(constants, RegExp.prototype.test.bind(/^E[A-Z]+$/)), function (code) {
  return -code;
});

var errors = require('./errors')(codes);

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

  this.SyncWriteStream = factories.syncWriteStream(this);

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
  return utils.invoke(this.base.access, [path, mode], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.appendFileSync = function (filename, data, options) {
  return utils.invoke(this.base.appendFile, [filename, data, options], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    if (error.code === 'options:type') {
      throw new TypeError('Bad arguments');
    }

    if (error.code === 'options:encoding') {
      throw new Error('Unknown encoding: ' + error.encoding);
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.chmodSync = function (path, mode) {
  return utils.invoke(this.base.chmod, [path, mode], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'path:type' || error.code === 'mode:type') {
      throw new TypeError('Bad argument');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.chownSync = function (path, uid, gid) {
  return utils.invoke(this.base.chown, [path, uid, gid], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    if (error.code === 'uid:type') {
      throw new TypeError('uid must be an unsigned int');
    }

    if (error.code === 'gid:type') {
      throw new TypeError('gid must be an unsigned int');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.closeSync = function (fd) {
  return utils.invoke(this.base.close, [fd], function (error) {
    if (error.code === 'fd:type') {
      throw new TypeError('Bad argument');
    }

    return errors[error.code](error);
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
    if (error.code === 'fd:type' || error.code === 'mode:type') {
      throw new TypeError('Bad argument');
    }

    return errors[error.code](error);
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

    return errors[error.code](error);
  });
};

VirtualFS.prototype.fdatasyncSync = function (fd) {
  return utils.invoke(this.base.fdatasync, [fd], function (error) {
    if (error.code === 'fd:type') {
      throw new TypeError('Bad argument');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.fstatSync = function (fd) {
  return utils.invoke(this.base.fstat, [fd], function (error) {
    if (error.code === 'fd:type') {
      throw new TypeError('Bad argument');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.fsyncSync = function (fd) {
  return utils.invoke(this.base.fsync, [fd], function (error) {
    if (error.code === 'fd:type') {
      throw new TypeError('Bad argument');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.ftruncateSync = function (fd, length) {
  return utils.invoke(this.base.ftruncate, [fd, length], function (error) {
    if (error.code === 'fd:type') {
      throw new TypeError('Bad argument');
    }

    if (error.code === 'length:type') {
      throw new TypeError('Not an integer');
    }

    return errors[error.code](error);
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

    return errors[error.code](error);
  });
};

VirtualFS.prototype.lchmodSync = function (path, mode) {
  return utils.invoke(this.base.lchmod, [path, mode], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'path:type' || error.code === 'mode:type') {
      throw new TypeError('Bad argument');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.lchownSync = function (path, uid, gid) {
  return utils.invoke(this.base.lchown, [path, uid, gid], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    if (error.code === 'uid:type') {
      throw new TypeError('uid must be an unsigned int');
    }

    if (error.code === 'gid:type') {
      throw new TypeError('gid must be an unsigned int');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.linkSync = function (srcpath, dstpath) {
  return utils.invoke(this.base.link, [srcpath, dstpath], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'srcpath:type') {
      throw new TypeError('dest path must be a string');
    }

    if (error.code === 'dstpath:type') {
      throw new TypeError('src path must be a string');
    }

    var path = error.code === 'EPERM' ? error.dest : error.path;

    return errors[error.code](assign(error, {path: path}));
  });
};

VirtualFS.prototype.lstatSync = function (path) {
  return utils.invoke(this.base.lstat, [path], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.mkdirSync = function (path, mode) {
  return utils.invoke(this.base.mkdir, [path, mode], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'path:type') {
      throw new TypeError('Bad argument');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.openSync = function (path, flags, mode) {
  return utils.invoke(this.base.open, [path, flags, mode], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    if (error.code === 'flags:type') {
      throw new TypeError('flags must be an int');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.readdirSync = function (path) {
  return utils.invoke(this.base.readdir, [path], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.readFileSync = function (filename, options) {
  return utils.invoke(this.base.readFile, [filename, options], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    if (error.code === 'options:type') {
      throw new TypeError('Bad arguments');
    }

    if (error.code === 'options:encoding') {
      throw new Error('Unknown encoding: ' + error.encoding);
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.readlinkSync = function (path) {
  return utils.invoke(this.base.readlink, [path], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.readSync = function (fd, buffer, offset, length, position) {
  return utils.invoke(this.base.read, [fd, buffer, offset, length, position], function (error) {
    if (error.code === 'fd:type') {
      throw new TypeError('Bad argument');
    }

    if (error.code === 'offset:size') {
      throw new Error('Offset is out of bounds');
    }

    if (error.code === 'length:size') {
      throw new RangeError('Length extends beyond buffer');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.realpathSync = function (path, cache) {
  return utils.invoke(this.base.realpath, [path, cache], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.renameSync = function (oldPath, newPath) {
  return utils.invoke(this.base.rename, [oldPath, newPath], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'old:type') {
      throw new TypeError('old path must be a string');
    }

    if (error.code === 'new:type') {
      throw new TypeError('new path must be a string');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.rmdirSync = function (path) {
  return utils.invoke(this.base.rmdir, [path], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.statSync = function (path) {
  return utils.invoke(this.base.stat, [path], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.symlinkSync = function (srcpath, dstpath) {
  return utils.invoke(this.base.symlink, [srcpath, dstpath], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'srcpath:type') {
      throw new TypeError('dest path must be a string');
    }

    if (error.code === 'dstpath:type') {
      throw new TypeError('src path must be a string');
    }

    var path = (error.code === 'EEXIST') ? dstpath : srcpath;

    return errors[error.code](assign(error, {path: path}));
  });
};

VirtualFS.prototype.truncateSync = function (path, length) {
  return utils.invoke(this.base.truncate, [path, length], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    if (error.code === 'length:type') {
      throw new TypeError('Not an integer');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.unlinkSync = function (path) {
  return utils.invoke(this.base.unlink, [path], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.utimesSync = function (path, atime, mtime) {
  return utils.invoke(this.base.utimes, [path, atime, mtime], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    if (error.code === 'atime:type') {
      throw new Error('Cannot parse time: ' + atime);
    }

    if (error.code === 'mtime:type') {
      throw new Error('Cannot parse time: ' + mtime);
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.writeFileSync = function (filename, data, options) {
  return utils.invoke(this.base.writeFile, [filename, data, options], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    if (error.code === 'path:type') {
      throw new TypeError('path must be a string');
    }

    if (error.code === 'options:type') {
      throw new TypeError('Bad arguments');
    }

    if (error.code === 'options:encoding') {
      throw new Error('Unknown encoding: ' + error.encoding);
    }

    return errors[error.code](error);
  });
};

VirtualFS.prototype.writeSync = function (fd, buffer, offset, length, position) {
  return utils.invoke(this.base.write, [fd, buffer, offset, length, position], function (error) {
    if (error.code === 'fd:type') {
      throw new TypeError('Bad argument');
    }

    if (error.code === 'offset:size') {
      throw new RangeError('offset out of bounds');
    }

    if (error.code === 'length:size') {
      throw new RangeError('length out of bounds');
    }

    return errors[error.code](error);
  });
};

// Watchers

VirtualFS.prototype.watch = function (filename, options, listener) {
  return utils.invoke(this.base.watch, [filename, options, listener], function () {
    throw new Error('Path must be a string without null bytes.');
  });
};

VirtualFS.prototype.watchFile = function (filename, options, listener) {
  return utils.invoke(this.base.watchFile, [filename, options, listener], function (error) {
    if (error.code === 'path:null') {
      throw new Error('Path must be a string without null bytes.');
    }

    throw new Error('watchFile requires a listener function');
  });
};

VirtualFS.prototype.unwatchFile = function (filename, listener) {
  return utils.invoke(this.base.unwatchFile, [filename, listener], function () {
    throw new Error('Path must be a string without null bytes.');
  });
};

// Internals

VirtualFS.prototype._toUnixTimestamp = function (time) {
  return this.base.toUnixTimestamp(time);
};

module.exports = VirtualFS;
