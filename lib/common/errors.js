'use strict';

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
      errno:   9,
      code:    'EBADF',
      syscall: syscall
    });
  },
  EINVAL: function (syscall, path) {
    return createError('EINVAL, invalid argument \'' + path + '\'', {
      errno:   18,
      code:    'EINVAL',
      path:    path,
      syscall: syscall
    });
  },
  ENOTDIR: function (syscall, path) {
    return createError('ENOTDIR, not a directory \'' + path + '\'', {
      errno:   27,
      code:    'ENOTDIR',
      path:    path,
      syscall: syscall
    });
  },
  EISDIR: function (syscall, path) {
    if (!path) {
      return createError('EISDIR, ' + syscall, {
        errno: 28,
        code:  'EISDIR'
      });
    }

    return createError('EISDIR, illegal operation on a directory \'' + path + '\'', {
      errno:   28,
      code:    'EISDIR',
      path:    path,
      syscall: syscall
    });
  },
  ENOENT: function (syscall, path) {
    return createError('ENOENT, no such file or directory \'' + path + '\'', {
      errno:   34,
      code:    'ENOENT',
      path:    path,
      syscall: syscall
    });
  },
  EEXIST: function (syscall, path) {
    return createError('EEXIST, file already exists \'' + path + '\'', {
      errno:   47,
      code:    'EEXIST',
      path:    path,
      syscall: syscall
    });
  }
};
