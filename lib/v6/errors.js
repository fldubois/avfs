'use strict';

var constants = require('constants');

var utils  = require('../common/utils');
var common = require('../common/errors');

var codes = utils.map(utils.filter(constants, RegExp.prototype.test.bind(/^E[A-Z]+$/)), function (code) {
  return -code;
});

var createFormatter = function (code, message) {
  return function (error) {
    if (typeof error === 'string') {
      error = {syscall: error};
    }

    var msg = code + ': ' + message + ', ' + error.syscall;

    var data = {
      errno:   codes[code],
      code:    code,
      syscall: error.syscall
    };

    if (error.hasOwnProperty('path')) {
      msg += ' \'' + error.path + '\'';

      data.path = error.path;
    }

    if (error.hasOwnProperty('dest')) {
      msg += ' -> \'' + error.dest + '\'';

      data.dest = error.dest;
    }

    return common.createError(msg, data);
  };
};

module.exports = {
  EACCES:  createFormatter('EACCES', 'permission denied'),
  EBADF:   createFormatter('EBADF', 'bad file descriptor'),
  EEXIST:  createFormatter('EEXIST', 'file already exists'),
  EINVAL:  createFormatter('EINVAL', 'invalid argument'),
  EISDIR:  createFormatter('EISDIR', 'illegal operation on a directory'),
  ELOOP:   createFormatter('ELOOP', 'too many symbolic links encountered'),
  ENOENT:  createFormatter('ENOENT', 'no such file or directory'),
  ENOTDIR: createFormatter('ENOTDIR', 'not a directory'),
  EPERM:   createFormatter('EPERM', 'operation not permitted'),

  nullCheck: common.nullCheck.bind(null, {
    message: 'Path must be a string without null bytes',
    code:    'ENOENT'
  })
};
