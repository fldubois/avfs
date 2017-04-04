'use strict';

var constants = require('./constants');

function createError(message, data) {
  var error = new Error(message);

  Object.keys(data).forEach(function (property) {
    error[property] = data[property];
  });

  error.stack = error.stack.split('\n').filter(function (line) {
    return line.indexOf(__filename + ':') === -1;
  }).join('\n');

  return error;
}

module.exports = {
  EBADF: function (syscall) {
    return createError('EBADF, bad file descriptor', {
      errno:   constants.EBADF,
      code:    'EBADF',
      syscall: syscall
    });
  },
  EINVAL: function (syscall, path) {
    return createError('EINVAL, invalid argument \'' + path + '\'', {
      errno:   constants.EINVAL,
      code:    'EINVAL',
      path:    path,
      syscall: syscall
    });
  },
  ENOTDIR: function (syscall, path) {
    return createError('ENOTDIR, not a directory \'' + path + '\'', {
      errno:   constants.ENOTDIR,
      code:    'ENOTDIR',
      path:    path,
      syscall: syscall
    });
  },
  EISDIR: function (syscall, path) {
    if (!path) {
      return createError('EISDIR, ' + syscall, {
        errno: constants.EISDIR,
        code:  'EISDIR'
      });
    }

    if (path === true) {
      return createError('EISDIR, illegal operation on a directory', {
        errno:   constants.EISDIR,
        code:    'EISDIR',
        syscall: syscall
      });
    }

    return createError('EISDIR, illegal operation on a directory \'' + path + '\'', {
      errno:   constants.EISDIR,
      code:    'EISDIR',
      path:    path,
      syscall: syscall
    });
  },
  ENOENT: function (syscall, path) {
    return createError('ENOENT, no such file or directory \'' + path + '\'', {
      errno:   constants.ENOENT,
      code:    'ENOENT',
      path:    path,
      syscall: syscall
    });
  },
  EEXIST: function (syscall, path) {
    return createError('EEXIST, file already exists \'' + path + '\'', {
      errno:   constants.EEXIST,
      code:    'EEXIST',
      path:    path,
      syscall: syscall
    });
  },
  EPERM: function (syscall, path) {
    return createError('EPERM, operation not permitted \'' + path + '\'', {
      errno:   constants.EPERM,
      code:    'EPERM',
      path:    path,
      syscall: syscall
    });
  }
};
