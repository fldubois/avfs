'use strict';

var AVFSError  = require('../avfs-error');

module.exports = function (storage, constants, handles) {
  var elements = require('../elements')(constants);
  var parsers  = require('../parsers')(constants);

  var attributes  = require('./attributes')(storage, constants);
  var permissions = require('./permissions')(storage);

  var Descriptor = require('../components/descriptor')(constants);
  var Stats      = require('../components/stats')(constants);

  return {
    open: function (filepath, flags, mode) {
      var file = null;

      flags = parsers.flags(flags);

      if (flags !== parseInt(flags, 10)) {
        throw new TypeError('flags must be an int');
      }

      try {
        file = storage.get(filepath);
      } catch (error) {
        if (error.code !== 'ENOENT' || !(flags & constants.O_CREAT)) {
          throw error;
        }
      }

      if (file !== null) {
        if (flags & constants.O_EXCL) {
          throw new AVFSError('EEXIST');
        }

        if (file.get('type') === constants.S_IFDIR && (flags & constants.O_WRONLY || flags & constants.O_RDWR)) {
          throw new AVFSError('EISDIR');
        }
      }

      var read  = (flags & (constants.O_RDWR | constants.O_RDONLY));
      var write = (flags & (constants.O_RDWR | constants.O_WRONLY));

      if (file !== null && process.getuid() !== 0 && ((write && !file.isWritable()) || (read && !file.isReadable()))) {
        throw new AVFSError('EACCES');
      }

      if (file === null || (flags & constants.O_TRUNC)) {
        file = elements.file(parsers.mode(mode, '0666'), new Buffer(0));
        storage.set(filepath, file);
      }

      var fd = handles.next++;

      var descriptor = new Descriptor(file, filepath, flags);

      if (flags & constants.O_APPEND) {
        descriptor.write = file.get('content').length;
      }

      handles[fd] = descriptor;

      return fd;
    },
    fchmod: function (fd, mode) {
      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed()) {
        throw new AVFSError('EBADF');
      }

      permissions.chmod(handles[fd].path, mode);
    },
    fchown: function (fd, uid, gid) {
      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed()) {
        throw new AVFSError('EBADF');
      }

      permissions.chown(handles[fd].path, uid, gid);
    },
    fdatasync: function (fd) {
      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed()) {
        throw new AVFSError('EBADF');
      }
    },
    fstat: function (fd) {
      if (!handles.hasOwnProperty(fd)) {
        throw new AVFSError('EBADF');
      }

      var file = handles[fd].file;

      return new Stats(file);
    },
    fsync: function (fd) {
      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed()) {
        throw new AVFSError('EBADF');
      }
    },
    ftruncate: function (fd, length) {
      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed() || !handles[fd].isWritable()) {
        throw new AVFSError('EBADF');
      }

      var file = handles[fd].file;

      file.set('content', (typeof length !== 'undefined') ? file.get('content').slice(0, length) : new Buffer(0));
    },
    futimes: function (fd, atime, mtime) {
      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed()) {
        throw new AVFSError('EBADF');
      }

      attributes.utimes(handles[fd].path, atime, mtime);
    },
    close: function (fd) {
      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed()) {
        throw new AVFSError('EBADF');
      }

      handles[fd].close();
    }
  };
};
