'use strict';

var assign = require('object-assign');

module.exports = assign({}, require('../v0.10/constants'), {
  // File Access Constants

  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1,

  // Error codes

  EACCES:  -13,
  EBADF:   -9,
  EEXIST:  -17,
  EINVAL:  -22,
  EISDIR:  -21,
  ENOENT:  -2,
  ENOTDIR: -20,
  EPERM:   -1
});
