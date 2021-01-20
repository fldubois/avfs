'use strict';

var common = require('../common/errors');

module.exports = function (constants) {
  return {
    EACCES: function (data) {
      var msg = 'EACCES: permission denied, ' + data.syscall + ' \'' + data.path + '\'';

      if (data.hasOwnProperty('dest')) {
        return common.createError(msg + ' -> \'' + data.dest + '\'', {
          errno:   constants.EACCES,
          code:    'EACCES',
          syscall: data.syscall,
          path:    data.path,
          dest:    data.dest
        });
      }

      return common.createError(msg, {
        errno:   constants.EACCES,
        code:    'EACCES',
        syscall: data.syscall,
        path:    data.path
      });
    },
    EBADF: function (data) {
      if (typeof data === 'string') {
        data = {syscall: data};
      }

      return common.createError('EBADF: bad file descriptor, ' + data.syscall, {
        errno:   constants.EBADF,
        code:    'EBADF',
        syscall: data.syscall
      });
    },
    EINVAL: function (data) {
      var msg = 'EINVAL: invalid argument, ' + data.syscall + ' \'' + data.path + '\'';

      if (data.hasOwnProperty('dest')) {
        return common.createError(msg + ' -> \'' + data.dest + '\'', {
          errno:   constants.EINVAL,
          code:    'EINVAL',
          syscall: data.syscall,
          path:    data.path,
          dest:    data.dest
        });
      }

      return common.createError(msg, {
        errno:   constants.EINVAL,
        code:    'EINVAL',
        syscall: data.syscall,
        path:    data.path
      });
    },
    ENOTDIR: function (data) {
      var msg = 'ENOTDIR: not a directory, ' + data.syscall + ' \'' + data.path + '\'';

      if (data.hasOwnProperty('dest')) {
        return common.createError(msg + ' -> \'' + data.dest + '\'', {
          errno:   constants.ENOTDIR,
          code:    'ENOTDIR',
          syscall: data.syscall,
          path:    data.path,
          dest:    data.dest
        });
      }

      return common.createError(msg, {
        errno:   constants.ENOTDIR,
        code:    'ENOTDIR',
        syscall: data.syscall,
        path:    data.path
      });
    },
    EISDIR: function (data) {
      if (typeof data === 'string') {
        data = {syscall: data};
      }

      var syscall = data.syscall;

      if (typeof data.path !== 'string') {
        return common.createError('EISDIR: illegal operation on a directory, ' + syscall, {
          errno:   constants.EISDIR,
          code:    'EISDIR',
          syscall: syscall
        });
      }

      return common.createError('EISDIR: illegal operation on a directory, ' + syscall + ' \'' + data.path + '\'', {
        errno:   constants.EISDIR,
        code:    'EISDIR',
        syscall: syscall,
        path:    data.path
      });
    },
    ENOENT: function (data) {
      var msg = 'ENOENT: no such file or directory, ' + data.syscall + ' \'' + data.path + '\'';

      if (data.hasOwnProperty('dest')) {
        return common.createError(msg + ' -> \'' + data.dest + '\'', {
          errno:   constants.ENOENT,
          code:    'ENOENT',
          syscall: data.syscall,
          path:    data.path,
          dest:    data.dest
        });
      }

      return common.createError(msg, {
        errno:   constants.ENOENT,
        code:    'ENOENT',
        syscall: data.syscall,
        path:    data.path
      });
    },
    EEXIST: function (data) {
      var msg = 'EEXIST: file already exists, ' + data.syscall + ' \'' + data.path + '\'';

      if (data.hasOwnProperty('dest')) {
        return common.createError(msg + ' -> \'' + data.dest + '\'', {
          errno:   constants.EEXIST,
          code:    'EEXIST',
          syscall: data.syscall,
          path:    data.path,
          dest:    data.dest
        });
      }

      return common.createError('EEXIST: file already exists, ' + data.syscall + ' \'' + data.path + '\'', {
        errno:   constants.EEXIST,
        code:    'EEXIST',
        syscall: data.syscall,
        path:    data.path
      });
    },
    EPERM: function (data) {
      var msg = 'EPERM: operation not permitted, ' + data.syscall + ' \'' + data.path + '\'';

      if (data.hasOwnProperty('dest')) {
        return common.createError(msg + ' -> \'' + data.dest + '\'', {
          errno:   constants.EPERM,
          code:    'EPERM',
          syscall: data.syscall,
          path:    data.path,
          dest:    data.dest
        });
      }

      return common.createError(msg, {
        errno:   constants.EPERM,
        code:    'EPERM',
        syscall: data.syscall,
        path:    data.path
      });
    },
    ELOOP: function (data) {
      var msg = 'ELOOP: too many symbolic links encountered, ' + data.syscall + ' \'' + data.path + '\'';

      return common.createError(msg, {
        errno:   constants.ELOOP,
        code:    'ELOOP',
        syscall: data.syscall,
        path:    data.path
      });
    },
    nullCheck: common.nullCheck.bind(null, {
      message: 'Path must be a string without null bytes',
      code:    'ENOENT'
    })
  };
};
