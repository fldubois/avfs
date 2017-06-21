'use strict';

var elements = require('../elements');
var parsers  = require('../parsers');

var Descriptor = require('../components/descriptor');
var Stats      = require('../components/stats');

module.exports = function (storage, errors, constants, handles) {
  var next = 0;

  var attributes  = require('./attributes')(storage);
  var permissions = require('./permissions')(storage, errors);

  return {
    open: function (filepath, flags, mode) {
      var file = null;

      try {
        file = storage.get('open', filepath);
      } catch (error) {
        if (error.code !== 'ENOENT' || !(flags & constants.O_CREAT)) {
          throw error;
        }
      }

      if (file !== null) {
        if (flags & constants.O_EXCL) {
          throw errors.EEXIST({syscall: 'open', path: filepath});
        }

        if (file.get('type') === constants.S_IFDIR && (flags & constants.O_WRONLY || flags & constants.O_RDWR)) {
          throw errors.EISDIR({syscall: 'open', path: filepath});
        }
      }

      var read  = (flags & (constants.O_RDWR | constants.O_RDONLY));
      var write = (flags & (constants.O_RDWR | constants.O_WRONLY));

      if (file !== null && process.getuid() !== 0 && ((write && !file.isWritable()) || (read && !file.isReadable()))) {
        throw errors.EACCES({syscall: 'open', path: filepath});
      }

      if (file === null || (flags & constants.O_TRUNC)) {
        file = elements.file(parsers.mode(mode, '0666'), new Buffer(0));
        storage.set('open', filepath, file);
      }

      var fd = next++;

      var descriptor = new Descriptor(file, filepath, flags);

      if (flags & constants.O_APPEND) {
        descriptor.write = file.get('content').length;
      }

      handles[fd] = descriptor;

      return fd;
    },
    fchmod: function (fd, mode) {
      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed()) {
        throw errors.EBADF({syscall: 'fchmod'});
      }

      permissions.chmod(handles[fd].path, mode);
    },
    fchown: function (fd, uid, gid) {
      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed()) {
        throw errors.EBADF({syscall: 'fchown'});
      }

      permissions.chown(handles[fd].path, uid, gid);
    },
    fdatasync: function (fd) {
      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed()) {
        throw errors.EBADF({syscall: 'fdatasync'});
      }
    },
    fstat: function (fd) {
      if (!handles.hasOwnProperty(fd)) {
        throw errors.EBADF({syscall: 'fstat'});
      }

      var file = handles[fd].file;

      return new Stats(file);
    },
    fsync: function (fd) {
      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed()) {
        throw errors.EBADF({syscall: 'fsync'});
      }
    },
    ftruncate: function (fd, length) {
      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed() || !handles[fd].isWritable()) {
        throw errors.EBADF({syscall: 'ftruncate'});
      }

      var file = handles[fd].file;

      file.set('content', (typeof length !== 'undefined') ? file.get('content').slice(0, length) : new Buffer(0));
    },
    futimes: function (fd, atime, mtime) {
      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed()) {
        throw errors.EBADF({syscall: 'futime'});
      }

      attributes.utimes(handles[fd].path, atime, mtime);
    },
    close: function (fd) {
      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed()) {
        throw errors.EBADF({syscall: 'close'});
      }

      handles[fd].close();
    }
  };
};
