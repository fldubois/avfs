'use strict';

var path = require('path');

var constants = require('./common/constants');
var errors    = require('./common/errors');
var elements  = require('./common/elements');
var utils     = require('./common/utils');
var storage   = require('./common/storage');

var Descriptor  = require('./common/descriptor');
var Stats       = require('./common/stats');

var ReadStream  = require('./common/read-stream');
var WriteStream = require('./common/write-stream');

function VirtualFS() {
  this.files   = elements.directory({}, '755');
  this.handles = {};
  this.next    = 0;

  this.ReadStream  = ReadStream.bind(null, this);
  this.WriteStream = WriteStream.bind(null, this);
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
  if (typeof filepath !== 'string') {
    throw new TypeError('Bad argument');
  }

  if (typeof mode !== 'string' && typeof mode !== 'number') {
    throw new TypeError('Bad argument');
  }

  var file = storage.get(this.files, 'chmod', filepath);

  if (process.getuid() !== 0 && process.getuid() !== file.get('uid')) {
    throw errors.EPERM('chmod', filepath);
  }

  file.set('mode', utils.parseMode(mode));
};

VirtualFS.prototype.chownSync = function (filepath, uid, gid) {
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
    throw errors.EPERM('chown', filepath);
  }

  file.set('uid', uid);
  file.set('gid', gid);
};

VirtualFS.prototype.closeSync = function (fd) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad argument');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed()) {
    throw errors.EBADF('close');
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
    throw errors.EBADF('fchmod');
  }

  this.chmodSync(this.handles[fd].path, mode);
};

VirtualFS.prototype.fchownSync = function (fd, uid, gid) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad argument');
  }

  if (typeof uid !== 'number' || uid < 0) {
    throw new TypeError('uid must be an unsigned int');
  }

  if (typeof gid !== 'number' || gid < 0) {
    throw new TypeError('gid must be an unsigned int');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed()) {
    throw errors.EBADF('fchmod');
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
    throw errors.EBADF('ftruncate');
  }

  var file = this.handles[fd].file;

  file.set('content', (typeof length !== 'undefined') ? file.get('content').slice(0, length) : new Buffer(0));
};

VirtualFS.prototype.fstatSync = function (fd) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad argument');
  }

  if (!this.handles.hasOwnProperty(fd)) {
    throw errors.EBADF('fstat');
  }

  var file = this.handles[fd].file;

  return new Stats(file);
};

VirtualFS.prototype.fsyncSync = function (fd) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad argument');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed()) {
    throw errors.EBADF('fsync');
  }
};

VirtualFS.prototype.futimesSync = function (fd, atime, mtime) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad argument');
  }

  if (typeof atime !== 'number' && !(atime instanceof Date)) {
    throw new Error('Cannot parse time: ' + atime);
  }

  if (typeof mtime !== 'number' && !(mtime instanceof Date)) {
    throw new Error('Cannot parse time: ' + mtime);
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed()) {
    throw errors.EBADF('fchmod');
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
    throw errors.EPERM('chmod', filepath);
  }

  file.set('mode', utils.parseMode(mode));
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
    throw errors.EPERM('chown', filepath);
  }

  file.set('uid', uid);
  file.set('gid', gid);
};

VirtualFS.prototype.linkSync = function (srcpath, dstpath) {
  if (typeof srcpath !== 'string') {
    throw new TypeError('dest path must be a string');
  }

  if (typeof dstpath !== 'string') {
    throw new TypeError('src path must be a string');
  }

  var file = storage.get(this.files, 'link', srcpath);

  if (file.get('type') === constants.S_IFDIR) {
    throw errors.EPERM('link', dstpath);
  }

  var parent   = storage.get(this.files, {syscall: 'link', filepath: srcpath}, dstpath, 1);
  var filename = path.basename(dstpath);

  if (parent.get('type') !== constants.S_IFDIR) {
    throw errors.ENOTDIR('link', srcpath);
  }

  if (parent.get('content').hasOwnProperty(filename)) {
    throw errors.EEXIST('link', dstpath);
  }

  file.set('nlink', file.get('nlink') + 1);

  parent.get('content')[filename] = file;
};

VirtualFS.prototype.lstatSync = function (filepath) {
  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  var element = storage.get(this.files, 'stat', filepath, false);

  return new Stats(element);
};

VirtualFS.prototype.mkdirSync = function (filepath, mode) {
  if (typeof filepath !== 'string') {
    throw new TypeError('Bad argument');
  }

  if (this.existsSync(filepath)) {
    throw errors.EEXIST('mkdir', filepath);
  }

  storage.set(this.files, 'mkdir', filepath, elements.directory(utils.parseMode(mode, '0777')));
};

VirtualFS.prototype.openSync = function (filepath, flagsString, mode) {
  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  var fgs    = utils.parseFlags(flagsString);
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
      throw errors.EEXIST('open', filepath);
    }

    if (file.get('type') === constants.S_IFDIR && (fgs & constants.O_WRONLY || fgs & constants.O_RDWR)) {
      throw errors.EISDIR('open', filepath);
    }
  }

  var read  = (fgs & (constants.O_RDWR | constants.O_RDONLY));
  var write = (fgs & (constants.O_RDWR | constants.O_WRONLY));

  if (file !== null && process.getuid() !== 0 && ((write && !file.isWritable()) || (read && !file.isReadable()))) {
    throw errors.EACCES('open', filepath);
  }

  if (file === null || (fgs & constants.O_TRUNC)) {
    file = elements.file(utils.parseMode(mode, '0666'), new Buffer(0));
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
    throw new TypeError('Bad arguments');
  }

  if (offset > buffer.length) {
    throw new Error('Offset is out of bounds');
  }

  if ((offset + length) > buffer.length) {
    throw new Error('Length extends beyond buffer');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed() || !(this.handles[fd].isReadable())) {
    throw errors.EBADF('read');
  }

  var file    = this.handles[fd].file;
  var content = file.get('content');

  if (file.get('type') === constants.S_IFDIR) {
    throw errors.EISDIR('read');
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
  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  var directory = storage.get(this.files, 'readdir', filepath);

  if (directory.get('type') !== constants.S_IFDIR) {
    throw errors.ENOTDIR('readdir', filepath);
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
    throw errors.EISDIR('read', true);
  }

  var content = this.handles[fd].file.get('content');
  var buffer  = new Buffer(content.length);

  content.copy(buffer);

  return options.encoding ? buffer.toString(options.encoding) : buffer;
};

VirtualFS.prototype.readlinkSync = function (linkpath) {
  if (typeof linkpath !== 'string') {
    throw new TypeError('path must be a string');
  }

  var link = storage.get(this.files, 'readlink', linkpath, false);

  if (link.get('type') !== constants.S_IFLNK) {
    throw errors.EINVAL('readlink', linkpath);
  }

  return link.get('target');
};

VirtualFS.prototype.realpathSync = function (filepath, cache) {
  if (typeof filepath !== 'string') {
    throw new TypeError('Arguments to path.resolve must be strings');
  }

  var base  = '';
  var elems = storage.parse(filepath);
  var index = 0;

  while (index < elems.length) {
    base += path.sep + elems[index];

    if (cache && cache.hasOwnProperty(base)) {
      if (typeof cache[base] !== 'string') {
        throw new TypeError('Arguments to path.resolve must be strings');
      }

      elems = storage.parse(cache[base]).concat(elems.slice(index + 1));
      base  = path.sep + elems.slice(0, index).join(path.sep);
    } else {
      var elem = storage.get(this.files, 'lstat', base, false);

      if (elem.get('type') === constants.S_IFLNK) {
        var target = storage.parse(elem.get('target'));

        base = path.sep + target.join(path.sep);

        elems = target.concat(elems.slice(index + 1));
        index = target.length - 1;
      }

      index++;
    }
  }

  return base;
};

VirtualFS.prototype.renameSync = function (oldPath, newPath) {
  if (newPath.indexOf(oldPath) !== -1) {
    throw errors.EINVAL('rename', oldPath);
  }

  var oldDirectory = storage.get(this.files, 'rename', oldPath, 1);
  var newDirectory = storage.get(this.files, 'rename', newPath, 1);

  if (!oldDirectory.isWritable() || !newDirectory.isWritable()) {
    throw errors.EACCES('rename', oldPath);
  }

  var file = storage.get(this.files, 'rename', oldPath);

  storage.set(this.files, {syscall: 'rename', filepath: oldPath}, newPath, file);

  storage.unset(this.files, {syscall: 'rename', filepath: oldPath}, oldPath);
};

VirtualFS.prototype.rmdirSync = function (filepath) {
  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  var directory = storage.get(this.files, 'rmdir', filepath);

  if (directory.get('type') !== constants.S_IFDIR) {
    throw errors.ENOTDIR('rmdir', filepath);
  }

  storage.unset(this.files, 'rmdir', filepath);
};

VirtualFS.prototype.statSync = function (filepath) {
  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  var element = storage.get(this.files, 'stat', filepath);

  return new Stats(element);
};

// TODO: type parameter support
VirtualFS.prototype.symlinkSync = function (srcpath, dstpath) {
  if (typeof srcpath !== 'string') {
    throw new TypeError('dest path must be a string');
  }

  if (typeof dstpath !== 'string') {
    throw new TypeError('src path must be a string');
  }

  if (this.existsSync(dstpath)) {
    throw errors.EEXIST('symlink', srcpath);
  }

  storage.set(this.files, 'symlink', dstpath, elements.symlink(utils.parseMode('0777'), srcpath));
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
  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  var file = storage.get(this.files, 'unlink', filepath);

  if (file.get('type') === constants.S_IFDIR) {
    throw errors.EISDIR('unlink', filepath);
  }

  file.set('nlink', file.get('nlink') - 1);

  storage.unset(this.files, 'unlink', filepath);
};

VirtualFS.prototype.utimesSync = function (filepath, atime, mtime) {
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
    throw new TypeError('Bad arguments');
  }

  if (offset > buffer.length) {
    throw new Error('Offset is out of bounds');
  }

  if ((offset + length) > buffer.length) {
    throw new Error('off + len > buffer.length');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed() || !this.handles[fd].isWritable()) {
    throw errors.EBADF('write');
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

  var content = Buffer.isBuffer(data) ? data : new Buffer(data.toString(), options.encoding || 'utf8');
  var fd      = this.openSync(filename, options.flag || 'w', options.mode);

  this.writeSync(fd, content, 0, content.length, null);
  this.closeSync(fd);
};

Object.keys(VirtualFS.prototype).filter(function (method) {
  return (/Sync$/.test(method) && ['readSync', 'writeSync'].indexOf(method) === -1);
}).forEach(function (method) {
  var async = method.replace('Sync', '');

  VirtualFS.prototype[async] = function () {
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
      result = this[method].apply(this, args);
    } catch (err) {
      error = err;
    }

    setImmediate(function () {
      return callback(error, result);
    });
  };
});

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

module.exports = VirtualFS;
