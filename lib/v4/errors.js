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
    var msg = 'EACCES: permission denied, ' + data.syscall + ' \'' + data.path + '\'';

    if (data.hasOwnProperty('dest')) {
      return createError(msg + ' -> \'' + data.dest + '\'', {
        errno:   constants.EACCES,
        code:    'EACCES',
        syscall: data.syscall,
        path:    data.path,
        dest:    data.dest
      });
    }

    return createError(msg, {
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
    var msg = 'EINVAL: invalid argument, ' + data.syscall + ' \'' + data.path + '\'';

    if (data.hasOwnProperty('dest')) {
      return createError(msg + ' -> \'' + data.dest + '\'', {
        errno:   constants.EINVAL,
        code:    'EINVAL',
        syscall: data.syscall,
        path:    data.path,
        dest:    data.dest
      });
    }

    return createError(msg, {
      errno:   constants.EINVAL,
      code:    'EINVAL',
      syscall: data.syscall,
      path:    data.path
    });
  },
  ENOTDIR: function (data) {
    var msg = 'ENOTDIR: not a directory, ' + data.syscall + ' \'' + data.path + '\'';

    if (data.hasOwnProperty('dest')) {
      return createError(msg + ' -> \'' + data.dest + '\'', {
        errno:   constants.ENOTDIR,
        code:    'ENOTDIR',
        syscall: data.syscall,
        path:    data.path,
        dest:    data.dest
      });
    }

    return createError(msg, {
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
    var msg = 'ENOENT: no such file or directory, ' + data.syscall + ' \'' + data.path + '\'';

    if (data.hasOwnProperty('dest')) {
      return createError(msg + ' -> \'' + data.dest + '\'', {
        errno:   constants.ENOENT,
        code:    'ENOENT',
        syscall: data.syscall,
        path:    data.path,
        dest:    data.dest
      });
    }

    return createError(msg, {
      errno:   constants.ENOENT,
      code:    'ENOENT',
      syscall: data.syscall,
      path:    data.path
    });
  },
  EEXIST: function (data) {
    var msg = 'EEXIST: file already exists, ' + data.syscall + ' \'' + data.path + '\'';

    if (data.hasOwnProperty('dest')) {
      return createError(msg + ' -> \'' + data.dest + '\'', {
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
    var msg = 'EPERM: operation not permitted, ' + data.syscall + ' \'' + data.path + '\'';

    if (data.hasOwnProperty('dest')) {
      return createError(msg + ' -> \'' + data.dest + '\'', {
        errno:   constants.EPERM,
        code:    'EPERM',
        syscall: data.syscall,
        path:    data.path,
        dest:    data.dest
      });
    }

    return createError(msg, {
      errno:   constants.EPERM,
      code:    'EPERM',
      syscall: data.syscall,
      path:    data.path
    });
  },

  nullCheck: function (filepath, callback) {
    if (('' + filepath).indexOf('\u0000') !== -1) {
      var error = new Error('Path must be a string without null bytes.');

      error.code = 'ENOENT';

      if (typeof callback !== 'function') {
        throw error;
      }

      process.nextTick(callback, error);

      return false;
    }

    return true;
  }
};
