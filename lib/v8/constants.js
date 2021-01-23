'use strict';

var assign = require('object-assign');

module.exports = assign({}, require('../v7/constants'), {
  // File Open Constants

  O_DSYNC: 4096,    // Flag indicating that the file is opened for synchronized I/O with write operations waiting for data integrity.
  O_SYNC:  1052672, // Flag indicating that the file is opened for synchronized I/O with write operations waiting for file integrity.

  // Copy modes

  COPYFILE_EXCL:       1,
  UV_FS_COPYFILE_EXCL: 1
});
