'use strict';

var common = require('../common/errors');

module.exports = function (codes) {
  return {
    EACCES: function (data) {
      return common.createError('EACCES, permission denied \'' + data.path + '\'', {
        errno:   codes.EACCES,
        code:    'EACCES',
        path:    data.path,
        syscall: data.syscall
      });
    },
    EBADF: function (data) {
      if (typeof data === 'string') {
        return common.createError('EBADF, ' + data, {
          errno: codes.EBADF,
          code:  'EBADF'
        });
      }

      return common.createError('EBADF, bad file descriptor', {
        errno:   codes.EBADF,
        code:    'EBADF',
        syscall: data.syscall
      });
    },
    EINVAL: function (data) {
      return common.createError('EINVAL, invalid argument \'' + data.path + '\'', {
        errno:   codes.EINVAL,
        code:    'EINVAL',
        path:    data.path,
        syscall: data.syscall
      });
    },
    ENOTDIR: function (data) {
      return common.createError('ENOTDIR, not a directory \'' + data.path + '\'', {
        errno:   codes.ENOTDIR,
        code:    'ENOTDIR',
        path:    data.path,
        syscall: data.syscall
      });
    },
    EISDIR: function (data) {
      if (typeof data === 'string') {
        return common.createError('EISDIR, ' + data, {
          errno: codes.EISDIR,
          code:  'EISDIR'
        });
      }

      if (!data.hasOwnProperty('path')) {
        return common.createError('EISDIR, illegal operation on a directory', {
          errno:   codes.EISDIR,
          code:    'EISDIR',
          syscall: data.syscall
        });
      }

      return common.createError('EISDIR, illegal operation on a directory \'' + data.path + '\'', {
        errno:   codes.EISDIR,
        code:    'EISDIR',
        path:    data.path,
        syscall: data.syscall
      });
    },
    ENOENT: function (data) {
      return common.createError('ENOENT, no such file or directory \'' + data.path + '\'', {
        errno:   codes.ENOENT,
        code:    'ENOENT',
        path:    data.path,
        syscall: data.syscall
      });
    },
    EEXIST: function (data) {
      return common.createError('EEXIST, file already exists \'' + data.path + '\'', {
        errno:   codes.EEXIST,
        code:    'EEXIST',
        path:    data.path,
        syscall: data.syscall
      });
    },
    EPERM: function (data) {
      var path = data.syscall === 'link' && data.hasOwnProperty('dest') ? data.dest : data.path;

      return common.createError('EPERM, operation not permitted \'' + path + '\'', {
        errno:   codes.EPERM,
        code:    'EPERM',
        path:    path,
        syscall: data.syscall
      });
    },
    ELOOP: function (data) {
      return common.createError('ELOOP, too many symbolic links encountered \'' + data.path + '\'', {
        errno:   codes.ELOOP,
        code:    'ELOOP',
        path:    data.path,
        syscall: data.syscall
      });
    },
    nullCheck: common.nullCheck
  };
};
