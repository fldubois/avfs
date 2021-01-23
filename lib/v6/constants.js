'use strict';

var assign = require('object-assign');

module.exports = assign({}, require('../v4/constants'), {
  // File Open Constants

  O_NOATIME: 262144 // Flag indicating reading accesses to the file system will no longer result in an update to the atime information associated with the file. This flag is available on Linux operating systems only.
});
