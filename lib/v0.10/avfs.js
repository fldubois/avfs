'use strict';

var path = require('path');
var util = require('util');

var constants = require('../common/constants');
var errors    = require('../common/errors');
var elements  = require('../common/elements');
var parsers   = require('../common/parsers');
var storage   = require('../common/storage');

var Descriptor  = require('../common/components/descriptor');
var Stats       = require('../common/components/stats');

var ReadStream  = require('../common/streams/read-stream');
var WriteStream = require('../common/streams/write-stream');

var SyncWriteStream = require('../common/streams/sync-write-stream');

var StatWatcher = require('../common/watchers/stat-watcher');
var FSWatcher   = require('../common/watchers/fs-watcher');

function VirtualFS() {
  var root = elements.directory('755', {});

  root.set('uid', 0);
  root.set('gid', 0);

  this.files   = root;
  this.handles = {};
  this.next    = 0;

  this.ReadStream  = ReadStream.bind(null, this);
  this.WriteStream = WriteStream.bind(null, this);

  this.FileReadStream  = this.ReadStream;
  this.FileWriteStream = this.WriteStream;

  this.SyncWriteStream = SyncWriteStream.bind(null, this);

  Object.defineProperty(this, 'watchers', {
    value:        {},
    configurable: false,
    enumerable:   false,
    writable:     false
  });

  // Asynchronous methods

  var prototype = Object.getPrototypeOf(this);

  for (var method in prototype) {
    if (/Sync$/.test(method)) {
      var name = method.replace('Sync', '');

      if (!(name in prototype)) {
        (function (sync, async) {
          prototype[async] = function () {
            var args     = Array.prototype.slice.call(arguments);
            var callback = null;

            if (typeof args[args.length - 1] === 'function') {
              callback = args.pop();
            } else {
              callback = function (error) {
                if (error) {
                  console.error('fs: missing callback ' + error.message);
                }
              };
            }

            var result = void 0;
            var error  = null;

            try {
              result = this[sync].apply(this, args);
            } catch (err) {
              error = err;
            }

            setImmediate(function () {
              return callback(error, result);
            });
          };
        })(method, name);
      }
    }
  }
}

VirtualFS.prototype.Stats = Stats;

VirtualFS.prototype.appendFileSync = function (filename, data, options) {
  if (!options) {
    options = {encoding: 'utf8', mode: '0666', flag: 'a'};
  } else if (typeof options === 'string') {
    options = {encoding: options, mode: '0666', flag: 'a'};
  } else if (typeof options !== 'object') {
    throw new TypeError('Bad arguments');
  }

  if (!options.hasOwnProperty('flag')) {
    options.flag = 'a';
  }

  this.writeFileSync(filename, data, options);
};

VirtualFS.prototype.chmodSync = function (filepath, mode) {
  errors.nullCheck(filepath);

  if (typeof filepath !== 'string') {
    throw new TypeError('Bad argument');
  }

  if (typeof mode !== 'string' && typeof mode !== 'number') {
    throw new TypeError('Bad argument');
  }

  var file = storage.get(this.files, 'chmod', filepath);

  if (process.getuid() !== 0 && process.getuid() !== file.get('uid')) {
    throw errors.EPERM({syscall: 'chmod', path: filepath});
  }

  file.set('mode', parsers.mode(mode));
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

  var file   = storage.get(this.files, 'chown', filepath);
  var groups = process.getgroups();

  if (process.getuid() !== 0 && (uid !== file.get('uid') || uid !== process.getuid() || groups.indexOf(gid) === -1)) {
    throw errors.EPERM({syscall: 'chown', path: filepath});
  }

  file.set('uid', uid);
  file.set('gid', gid);
};

VirtualFS.prototype.closeSync = function (fd) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad argument');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed()) {
    throw errors.EBADF({syscall: 'close'});
  }

  this.handles[fd].close();
};

VirtualFS.prototype.createReadStream = function (filename, options) {
  return this.ReadStream(filename, options);
};

VirtualFS.prototype.createWriteStream = function (filename, options) {
  return this.WriteStream(filename, options);
};

VirtualFS.prototype.existsSync = function (filepath) {
  if (typeof filepath !== 'string') {
    return false;
  }

  try {
    errors.nullCheck(filepath);

    storage.get(this.files, 'exists', filepath);

    return true;
  } catch (error) {
    return false;
  }
};

VirtualFS.prototype.fchmodSync = function (fd, mode) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad argument');
  }

  if (typeof mode !== 'string' && typeof mode !== 'number') {
    throw new TypeError('Bad argument');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed()) {
    throw errors.EBADF({syscall: 'fchmod'});
  }

  this.chmodSync(this.handles[fd].path, mode);
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

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed()) {
    throw errors.EBADF({syscall: 'fchown'});
  }

  this.chownSync(this.handles[fd].path, uid, gid);
};

VirtualFS.prototype.ftruncateSync = function (fd, length) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad argument');
  }

  if (typeof length !== 'undefined' && length !== parseInt(length, 10)) {
    throw new TypeError('Not an integer');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed() || !this.handles[fd].isWritable()) {
    throw errors.EBADF({syscall: 'ftruncate'});
  }

  var file = this.handles[fd].file;

  file.set('content', (typeof length !== 'undefined') ? file.get('content').slice(0, length) : new Buffer(0));
};

VirtualFS.prototype.fstatSync = function (fd) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad argument');
  }

  if (!this.handles.hasOwnProperty(fd)) {
    throw errors.EBADF({syscall: 'fstat'});
  }

  var file = this.handles[fd].file;

  return new Stats(file);
};

VirtualFS.prototype.fdatasyncSync = function (fd) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad argument');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed()) {
    throw errors.EBADF({syscall: 'fdatasync'});
  }
};

VirtualFS.prototype.fsyncSync = function (fd) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad argument');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed()) {
    throw errors.EBADF({syscall: 'fsync'});
  }
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

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed()) {
    throw errors.EBADF({syscall: 'futime'});
  }

  this.utimesSync(this.handles[fd].path, atime, mtime);
};

VirtualFS.prototype.lchmodSync = function (filepath, mode) {
  if (typeof filepath !== 'string') {
    throw new TypeError('Bad argument');
  }

  if (typeof mode !== 'string' && typeof mode !== 'number') {
    throw new TypeError('Bad argument');
  }

  var file = storage.get(this.files, 'chmod', filepath, false);

  if (process.getuid() !== 0 && process.getuid() !== file.get('uid')) {
    throw errors.EPERM({syscall: 'chmod', path: filepath});
  }

  file.set('mode', parsers.mode(mode));
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

  var file   = storage.get(this.files, 'chown', filepath, false);
  var groups = process.getgroups();

  if (process.getuid() !== 0 && (uid !== file.get('uid') || uid !== process.getuid() || groups.indexOf(gid) === -1)) {
    throw errors.EPERM({syscall: 'chown', path: filepath});
  }

  file.set('uid', uid);
  file.set('gid', gid);
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

  var file = storage.get(this.files, 'link', srcpath);

  if (file.get('type') === constants.S_IFDIR) {
    throw errors.EPERM({syscall: 'link', path: dstpath});
  }

  var parent   = storage.get(this.files, {syscall: 'link', path: srcpath}, dstpath, 1);
  var filename = path.basename(dstpath);

  if (parent.get('type') !== constants.S_IFDIR) {
    throw errors.ENOTDIR({syscall: 'link', path: srcpath});
  }

  if (parent.get('content').hasOwnProperty(filename)) {
    throw errors.EEXIST({syscall: 'link', path: dstpath});
  }

  file.set('nlink', file.get('nlink') + 1);

  parent.get('content')[filename] = file;
};

VirtualFS.prototype.lstatSync = function (filepath) {
  errors.nullCheck(filepath);

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  var element = storage.get(this.files, 'lstat', filepath, false);

  return new Stats(element);
};

VirtualFS.prototype.mkdirSync = function (filepath, mode) {
  errors.nullCheck(filepath);

  if (typeof filepath !== 'string') {
    throw new TypeError('Bad argument');
  }

  if (this.existsSync(filepath)) {
    throw errors.EEXIST({syscall: 'mkdir', path: filepath});
  }

  storage.set(this.files, 'mkdir', filepath, elements.directory(parsers.mode(mode, '0777')));
};

VirtualFS.prototype.openSync = function (filepath, flagsString, mode) {
  errors.nullCheck(filepath);

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  var fgs    = parsers.flags(flagsString);
  var file   = null;

  if (fgs !== parseInt(fgs, 10)) {
    throw new TypeError('flags must be an int');
  }

  try {
    file = storage.get(this.files, 'open', filepath);
  } catch (error) {
    if (error.code !== 'ENOENT' || !(fgs & constants.O_CREAT)) {
      throw error;
    }
  }

  if (file !== null) {
    if (fgs & constants.O_EXCL) {
      throw errors.EEXIST({syscall: 'open', path: filepath});
    }

    if (file.get('type') === constants.S_IFDIR && (fgs & constants.O_WRONLY || fgs & constants.O_RDWR)) {
      throw errors.EISDIR({syscall: 'open', path: filepath});
    }
  }

  var read  = (fgs & (constants.O_RDWR | constants.O_RDONLY));
  var write = (fgs & (constants.O_RDWR | constants.O_WRONLY));

  if (file !== null && process.getuid() !== 0 && ((write && !file.isWritable()) || (read && !file.isReadable()))) {
    throw errors.EACCES({syscall: 'open', path: filepath});
  }

  if (file === null || (fgs & constants.O_TRUNC)) {
    file = elements.file(parsers.mode(mode, '0666'), new Buffer(0));
    storage.set(this.files, 'open', filepath, file);
  }

  var fd = this.next++;

  var descriptor = new Descriptor(file, filepath, fgs);

  if (fgs & constants.O_APPEND) {
    descriptor.write = file.get('content').length;
  }

  this.handles[fd] = descriptor;

  return fd;
};

VirtualFS.prototype.readSync = function (fd, buffer, offset, length, position) {
  var bytesRead = 0;

  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad argument');
  }

  if (offset > buffer.length) {
    throw new Error('Offset is out of bounds');
  }

  if ((offset + length) > buffer.length) {
    throw new Error('Length extends beyond buffer');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed() || !(this.handles[fd].isReadable())) {
    throw errors.EBADF({syscall: 'read'});
  }

  var file    = this.handles[fd].file;
  var content = file.get('content');

  if (file.get('type') === constants.S_IFDIR) {
    throw errors.EISDIR({syscall: 'read'});
  }

  var pos = (position !== null) ? position : this.handles[fd].read;

  bytesRead = Math.min(length, Math.max(content.length - pos, 0));

  if (bytesRead > 0) {
    content.copy(buffer, offset, pos, pos + bytesRead);
  }

  if (position === null) {
    this.handles[fd].read += bytesRead;
  }

  return bytesRead;
};

VirtualFS.prototype.readdirSync = function (filepath) {
  errors.nullCheck(filepath);

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  var directory = storage.get(this.files, 'readdir', filepath);

  if (directory.get('type') !== constants.S_IFDIR) {
    throw errors.ENOTDIR({syscall: 'readdir', path: filepath});
  }

  return Object.keys(directory.get('content'));
};

VirtualFS.prototype.readFileSync = function (filename, options) {
  if (!options) {
    options = {encoding: null, flag: 'r'};
  } else if (typeof options === 'string') {
    options = {encoding: options, flag: 'r'};
  } else if (typeof options !== 'object') {
    throw new TypeError('Bad arguments');
  }

  if (options.encoding && !Buffer.isEncoding(options.encoding)) {
    throw new Error('Unknown encoding: ' + options.encoding);
  }

  var fd = this.openSync(filename, options.flag || 'r');

  if (this.handles[fd].file.get('type') === constants.S_IFDIR) {
    throw errors.EISDIR({syscall: 'read'});
  }

  var content = this.handles[fd].file.get('content');
  var buffer  = new Buffer(content.length);

  content.copy(buffer);

  return options.encoding ? buffer.toString(options.encoding) : buffer;
};

VirtualFS.prototype.readlinkSync = function (linkpath) {
  errors.nullCheck(linkpath);

  if (typeof linkpath !== 'string') {
    throw new TypeError('path must be a string');
  }

  var link = storage.get(this.files, 'readlink', linkpath, false);

  if (link.get('type') !== constants.S_IFLNK) {
    throw errors.EINVAL({syscall: 'readlink', path: linkpath});
  }

  return link.get('target');
};

VirtualFS.prototype.realpathSync = function (filepath, cache) {
  path.resolve(filepath);

  if (cache && cache.hasOwnProperty(filepath)) {
    return cache[filepath];
  }

  var base  = path.sep;
  var elems = storage.parse(filepath);
  var index = 0;

  while (index < elems.length) {
    base = path.resolve(base, elems[index]);

    if (cache && cache.hasOwnProperty(base)) {
      path.resolve(cache[base]);

      var cachedElems = storage.parse(cache[base]);

      elems = cachedElems.concat(elems.slice(index + 1));
      base  = path.sep + cachedElems.join(path.sep);
      index = cachedElems.length - 1;
    }

    var elem = storage.get(this.files, 'lstat', base, false);

    if (elem.get('type') === constants.S_IFLNK) {
      var target = storage.parse(elem.get('target'));

      base = path.sep + target.join(path.sep);

      elems = target.concat(elems.slice(index + 1));
      index = target.length - 1;
    }

    index++;
  }

  return base;
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

  if (newPath.indexOf(oldPath) !== -1) {
    throw errors.EINVAL({syscall: 'rename', path: oldPath});
  }

  var oldDirectory = storage.get(this.files, {syscall: 'rename', path: oldPath}, oldPath, 1);
  var newDirectory = storage.get(this.files, {syscall: 'rename', path: oldPath}, newPath, 1);

  if (!oldDirectory.isWritable() || !newDirectory.isWritable()) {
    throw errors.EACCES({syscall: 'rename', path: oldPath});
  }

  var file = storage.get(this.files, 'rename', oldPath);

  storage.set(this.files, {syscall: 'rename', path: oldPath}, newPath, file);

  storage.unset(this.files, {syscall: 'rename', path: oldPath}, oldPath);
};

VirtualFS.prototype.rmdirSync = function (filepath) {
  errors.nullCheck(filepath);

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  var directory = storage.get(this.files, 'rmdir', filepath);

  if (directory.get('type') !== constants.S_IFDIR) {
    throw errors.ENOTDIR({syscall: 'rmdir', path: filepath});
  }

  storage.unset(this.files, 'rmdir', filepath);
};

VirtualFS.prototype.statSync = function (filepath) {
  errors.nullCheck(filepath);

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  var element = storage.get(this.files, 'stat', filepath);

  return new Stats(element);
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

  if (this.existsSync(dstpath)) {
    throw errors.EEXIST({syscall: 'symlink', path: srcpath});
  }

  storage.set(this.files, 'symlink', dstpath, elements.symlink(parsers.mode('0777'), srcpath));
};

VirtualFS.prototype.truncateSync = function (filepath, length) {
  var fd = null;

  try {
    fd = this.openSync(filepath, 'r+');
    this.ftruncateSync(fd, length);
  } finally {
    if (fd !== null) {
      this.closeSync(fd);
    }
  }
};

VirtualFS.prototype.unlinkSync = function (filepath) {
  errors.nullCheck(filepath);

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  var file = storage.get(this.files, 'unlink', filepath);

  if (file.get('type') === constants.S_IFDIR) {
    throw errors.EISDIR({syscall: 'unlink', path: filepath});
  }

  file.set('nlink', file.get('nlink') - 1);

  storage.unset(this.files, 'unlink', filepath);
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

  var file = storage.get(this.files, 'utime', filepath);

  file.set('atime', (typeof atime === 'number') ? new Date(atime * 1000) : atime);
  file.set('mtime', (typeof mtime === 'number') ? new Date(mtime * 1000) : mtime);
};

VirtualFS.prototype.writeSync = function (fd, buffer, offset, length, position) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad argument');
  }

  if (offset > buffer.length && length > 0) {
    throw new Error('Offset is out of bounds');
  }

  if ((offset + length) > buffer.length) {
    throw new Error('off + len > buffer.length');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed() || !this.handles[fd].isWritable()) {
    throw errors.EBADF({syscall: 'write'});
  }

  var file    = this.handles[fd].file;
  var content = file.get('content');

  var pos = 0;

  if (this.handles[fd].flags & constants.O_APPEND) {
    pos = content.length;
  } else if (position !== null) {
    pos = position;
  } else {
    pos = this.handles[fd].write;
  }

  if (content.length < pos + length) {
    var tmp = new Buffer(pos + length);

    tmp.fill(' ', content.length, pos + length);

    content.copy(tmp, 0, 0, content.length);

    content = tmp;

    file.set('content', content);
  }

  buffer.copy(content, pos, offset, offset + length);

  if (position === null) {
    this.handles[fd].write += length;
  }

  return length;
};

VirtualFS.prototype.writeFileSync = function (filename, data, options) {
  if (typeof filename !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (!options) {
    options = {encoding: null, mode: '0666', flag: 'a'};
  } else if (typeof options === 'string') {
    options = {encoding: options, mode: '0666', flag: 'a'};
  } else if (typeof options !== 'object') {
    throw new TypeError('Bad arguments');
  }

  if (options.encoding && !Buffer.isEncoding(options.encoding)) {
    throw new Error('Unknown encoding: ' + options.encoding);
  }

  var content = Buffer.isBuffer(data) ? data : new Buffer(data.toString(), options.encoding || 'utf8');
  var fd      = this.openSync(filename, options.flag || 'w', options.mode);

  this.writeSync(fd, content, 0, content.length, null);
  this.closeSync(fd);
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
      return callback(error, bytesRead || 0, buffer);
    });
  }
};

VirtualFS.prototype.write = function (fd, buffer, offset, length, position, callback) {
  if (!length) {
    if (typeof callback === 'function') {
      setImmediate(function () {
        callback(null, 0);
      });
    }

    return;
  }

  if (typeof callback !== 'function') {
    callback = function (error) {
      if (error) {
        console.error('fs: missing callback ' + error.message);
      }
    };
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
    return callback(error, written || 0, buffer);
  });
};

// Watchers

VirtualFS.prototype.watch = function (filename, options, listener) {
  errors.nullCheck(filename);

  var defaults = {
    persistent: true
  };

  if (typeof options !== 'object') {
    listener = options;
    options  = defaults;
  } else {
    options = util._extend(defaults, options);
  }

  var watcher = new FSWatcher();

  watcher.start(filename, options.persistent);

  if (listener) {
    watcher.addListener('change', listener);
  }

  return watcher;
};

VirtualFS.prototype.watchFile = function (filename, options, listener) {
  errors.nullCheck(filename);

  var defaults = {
    interval:   5007,
    persistent: true
  };

  if (typeof options !== 'object') {
    listener = options;
    options  = defaults;
  } else {
    options = util._extend(defaults, options);
  }

  if (!listener) {
    throw new Error('watchFile requires a listener function');
  }

  if (typeof this.watchers[filename] === 'undefined') {
    this.watchers[filename] = new StatWatcher();

    this.watchers[filename].start(filename, options.persistent, options.interval);
  }

  var watcher = this.watchers[filename];

  watcher.addListener('change', listener);

  return watcher;
};

VirtualFS.prototype.unwatchFile = function (filename, listener) {
  errors.nullCheck(filename);

  if (typeof this.watchers[filename] !== 'undefined') {
    var watcher = this.watchers[filename];

    if (typeof listener === 'function') {
      watcher.removeListener('change', listener);
    } else {
      watcher.removeAllListeners('change');
    }

    if (watcher.listeners('change').length === 0) {
      watcher.stop();

      this.watchers[filename] = void 0;
    }
  }
};

// Internals

VirtualFS.prototype._toUnixTimestamp = function (time) {
  if (typeof time === 'string' && /^[0-9]+$/.test(time)) {
    return parseInt(time, 10);
  }

  if (typeof time === 'number') {
    if (!Number.isFinite(time) || time < 0) {
      return Date.now() / 1000;
    }

    return time;
  }

  if (util.isDate(time)) {
    return time.getTime() / 1000;
  }

  throw new Error('Cannot parse time: ' + time);
};

module.exports = VirtualFS;
