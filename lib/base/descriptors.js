'use strict';

var assign = require('object-assign');

var errors = require('../common/errors');

var AVFSError = require('../common/avfs-error');

module.exports = function (storage, constants, handles) {
  var elements = require('../common/elements')(constants);
  var parsers  = require('../common/parsers')(constants);

  var attributes  = require('./attributes')(storage, constants);
  var permissions = require('./permissions')(storage);

  var Descriptor = require('../common/components/descriptor')(constants);
  var Stats      = require('../common/components/stats')(constants);

  return {
    open: function (filepath, flags, mode) {
      var file = null;

      errors.nullCheck(filepath);

      if (typeof filepath !== 'string') {
        throw new AVFSError('path:type');
      }

      flags = parsers.flags(flags);

      if (flags !== parseInt(flags, 10)) {
        throw new AVFSError('flags:type', {value: flags});
      }

      try {
        file = storage.get(filepath);
      } catch (error) {
        if (error.code !== 'ENOENT' || !(flags & constants.O_CREAT)) {
          throw assign(error, {syscall: 'open', path: filepath});
        }
      }

      if (file !== null) {
        if (flags & constants.O_EXCL) {
          throw new AVFSError('EEXIST', {syscall: 'open', path: filepath});
        }

        if (file.get('type') === constants.S_IFDIR && (flags & constants.O_WRONLY || flags & constants.O_RDWR)) {
          throw new AVFSError('EISDIR', {syscall: 'open', path: filepath});
        }

        if (file.get('type') !== constants.S_IFDIR && (flags & constants.O_DIRECTORY)) {
          throw new AVFSError('ENOTDIR', {syscall: 'open', path: filepath});
        }

        if (file.get('type') !== constants.S_IFLNK && (flags & constants.O_NOFOLLOW)) {
          throw new AVFSError('ELOOP', {syscall: 'open', path: filepath});
        }
      }

      var read  = !(flags & constants.O_WRONLY);
      var write = (flags & (constants.O_RDWR | constants.O_WRONLY));

      if (file !== null && process.getuid() !== 0 && ((write && !file.isWritable()) || (read && !file.isReadable()))) {
        throw new AVFSError('EACCES', {syscall: 'open', path: filepath});
      }

      if (file === null) {
        file = elements.file(parsers.mode(mode, '0666'), new Buffer(0));

        try {
          storage.set(filepath, file);
        } catch (error) {
          throw assign(error, {syscall: 'open', path: filepath});
        }
      } else if (flags & constants.O_TRUNC) {
        file.set('content', new Buffer(0));
      }

      var fd = handles.next++;

      var descriptor = new Descriptor(file, filepath, flags);

      if (constants.hasOwnProperty('O_APPEND') && flags & constants.O_APPEND) {
        descriptor.write = file.get('content').length;
      }

      handles[fd] = descriptor;

      return fd;
    },
    fchmod: function (fd, mode) {
      if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
        throw new AVFSError('fd:type');
      }

      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed()) {
        throw new AVFSError('EBADF', {syscall: 'fchmod'});
      }

      permissions.chmod(handles[fd].path, mode);
    },
    fchown: function (fd, uid, gid) {
      if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
        throw new AVFSError('fd:type');
      }

      if (typeof uid !== 'number' || uid < 0) {
        throw new AVFSError('uid:type');
      }

      if (typeof gid !== 'number' || gid < 0) {
        throw new AVFSError('gid:type');
      }

      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed()) {
        throw new AVFSError('EBADF', {syscall: 'fchown'});
      }

      permissions.chown(handles[fd].path, uid, gid);
    },
    fdatasync: function (fd) {
      if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
        throw new AVFSError('fd:type');
      }

      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed()) {
        throw new AVFSError('EBADF', {syscall: 'fdatasync'});
      }
    },
    fstat: function (fd) {
      if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
        throw new AVFSError('fd:type');
      }

      if (!handles.hasOwnProperty(fd)) {
        throw new AVFSError('EBADF', {syscall: 'fstat'});
      }

      var file = handles[fd].file;

      return new Stats(file);
    },
    fsync: function (fd) {
      if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
        throw new AVFSError('fd:type');
      }

      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed()) {
        throw new AVFSError('EBADF', {syscall: 'fsync'});
      }
    },
    ftruncate: function (fd, length) {
      if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
        throw new AVFSError('fd:type');
      }

      if (typeof length !== 'undefined' && length !== parseInt(length, 10)) {
        throw new AVFSError('length:type');
      }

      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed() || !handles[fd].isWritable()) {
        throw new AVFSError('EBADF', {syscall: 'ftruncate'});
      }

      var file = handles[fd].file;

      file.set('content', (typeof length !== 'undefined') ? file.get('content').slice(0, length) : new Buffer(0));
    },
    futimes: function (fd, atime, mtime) {
      if (typeof atime !== 'number' && !(atime instanceof Date)) {
        throw new AVFSError('atime:type');
      }

      if (typeof mtime !== 'number' && !(mtime instanceof Date)) {
        throw new AVFSError('mtime:type');
      }

      if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
        throw new AVFSError('fd:type');
      }

      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed()) {
        throw new AVFSError('EBADF', {syscall: 'futime'});
      }

      attributes.utimes(handles[fd].path, atime, mtime);
    },
    close: function (fd) {
      if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
        throw new AVFSError('fd:type');
      }

      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed()) {
        throw new AVFSError('EBADF', {syscall: 'close'});
      }

      handles[fd].close();
    }
  };
};
