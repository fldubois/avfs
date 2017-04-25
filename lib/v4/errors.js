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
    return createError('EACCES: permission denied, ' + data.syscall + ' \'' + data.path + '\'', {
      errno:   constants.EACCES,
      code:    'EACCES',
      syscall: data.syscall,
      path:    data.path
    });
  },
  EBADF: function (data) {
    return createError('EBADF: bad file descriptor, ' + data.syscall, {
      errno:   constants.EBADF,
      code:    'EBADF',
      syscall: data.syscall
    });
  },
  EINVAL: function (data) {
    return createError('EINVAL: invalid argument, ' + data.syscall + ' \'' + data.path + '\'', {
      errno:   constants.EINVAL,
      code:    'EINVAL',
      syscall: data.syscall,
      path:    data.path
    });
  },
  ENOTDIR: function (data) {
    return createError('ENOTDIR: not a directory, ' + data.syscall + ' \'' + data.path + '\'', {
      errno:   constants.ENOTDIR,
      code:    'ENOTDIR',
      syscall: data.syscall,
      path:    data.path
    });
  },
  EISDIR: function (data) {
    if (typeof data.path !== 'string') {
      return createError('EISDIR: illegal operation on a directory, ' + data.syscall, {
        errno:   constants.EISDIR,
        code:    'EISDIR',
        syscall: data.syscall
      });
    }

    return createError('EISDIR: illegal operation on a directory, ' + data.syscall + ' \'' + data.path + '\'', {
      errno:   constants.EISDIR,
      code:    'EISDIR',
      syscall: data.syscall,
      path:    data.path
    });
  },
  ENOENT: function (data) {
    return createError('ENOENT: no such file or directory, ' + data.syscall + ' \'' + data.path + '\'', {
      errno:   constants.ENOENT,
      code:    'ENOENT',
      syscall: data.syscall,
      path:    data.path
    });
  },
  EEXIST: function (data) {
    if (data.hasOwnProperty('dest')) {
      var msg = 'EEXIST: file already exists, ' + data.syscall + ' \'' + data.path + '\' -> \'' + data.dest + '\'';

      return createError(msg, {
        errno:   constants.EEXIST,
        code:    'EEXIST',
        syscall: data.syscall,
        path:    data.path,
        dest:    data.dest
      });
    }

    return createError('EEXIST: file already exists, ' + data.syscall + ' \'' + data.path + '\'', {
      errno:   constants.EEXIST,
      code:    'EEXIST',
      syscall: data.syscall,
      path:    data.path
    });
  },
  EPERM: function (data) {
    return createError('EPERM: operation not permitted, ' + data.syscall + ' \'' + data.path + '\'', {
      errno:   constants.EPERM,
      code:    'EPERM',
      syscall: data.syscall,
      path:    data.path
    });
  }
};
