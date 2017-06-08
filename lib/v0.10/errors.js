'use strict';

var constants = require('../common/constants');

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
  EACCES: function (data) {
    return createError('EACCES, permission denied \'' + data.path + '\'', {
      errno:   constants.EACCES,
      code:    'EACCES',
      path:    data.path,
      syscall: data.syscall
    });
  },
  EBADF: function (data) {
    return createError('EBADF, bad file descriptor', {
      errno:   constants.EBADF,
      code:    'EBADF',
      syscall: data.syscall
    });
  },
  EINVAL: function (data) {
    return createError('EINVAL, invalid argument \'' + data.path + '\'', {
      errno:   constants.EINVAL,
      code:    'EINVAL',
      path:    data.path,
      syscall: data.syscall
    });
  },
  ENOTDIR: function (data) {
    return createError('ENOTDIR, not a directory \'' + data.path + '\'', {
      errno:   constants.ENOTDIR,
      code:    'ENOTDIR',
      path:    data.path,
      syscall: data.syscall
    });
  },
  EISDIR: function (data) {
    if (!data.hasOwnProperty('path')) {
      return createError('EISDIR, illegal operation on a directory', {
        errno:   constants.EISDIR,
        code:    'EISDIR',
        syscall: data.syscall
      });
    }

    return createError('EISDIR, illegal operation on a directory \'' + data.path + '\'', {
      errno:   constants.EISDIR,
      code:    'EISDIR',
      path:    data.path,
      syscall: data.syscall
    });
  },
  ENOENT: function (data) {
    return createError('ENOENT, no such file or directory \'' + data.path + '\'', {
      errno:   constants.ENOENT,
      code:    'ENOENT',
      path:    data.path,
      syscall: data.syscall
    });
  },
  EEXIST: function (data) {
    return createError('EEXIST, file already exists \'' + data.path + '\'', {
      errno:   constants.EEXIST,
      code:    'EEXIST',
      path:    data.path,
      syscall: data.syscall
    });
  },
  EPERM: function (data) {
    return createError('EPERM, operation not permitted \'' + data.path + '\'', {
      errno:   constants.EPERM,
      code:    'EPERM',
      path:    data.path,
      syscall: data.syscall
    });
  },

  nullCheck: function (filepath) {
    if (('' + filepath).indexOf('\u0000') !== -1) {
      throw new Error('Path must be a string without null bytes.');
    }
  }
};
