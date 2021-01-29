'use strict';

var common = require('../common/errors');

module.exports = function (codes) {
  var createFormatter = function (code, message) {
    return function (error) {
      if (typeof error === 'string') {
        return common.createError(code + ', ' + error, {
          errno: codes[code],
          code:  code
        });
      }

      if (error.hasOwnProperty('path')) {
        return common.createError(code + ', ' + message + ' \'' + error.path + '\'', {
          errno:   codes[code],
          code:    code,
          path:    error.path,
          syscall: error.syscall
        });
      }

      return common.createError(code + ', ' + message, {
        errno:   codes[code],
        code:    code,
        syscall: error.syscall
      });
    };
  };

  return {
    EACCES:  createFormatter('EACCES', 'permission denied'),
    EBADF:   createFormatter('EBADF', 'bad file descriptor'),
    EEXIST:  createFormatter('EEXIST', 'file already exists'),
    EINVAL:  createFormatter('EINVAL', 'invalid argument'),
    EISDIR:  createFormatter('EISDIR', 'illegal operation on a directory'),
    ELOOP:   createFormatter('ELOOP', 'too many symbolic links encountered'),
    ENOENT:  createFormatter('ENOENT', 'no such file or directory'),
    ENOTDIR: createFormatter('ENOTDIR', 'not a directory'),
    EPERM:   createFormatter('EPERM', 'operation not permitted'),

    nullCheck: common.nullCheck
  };
};
