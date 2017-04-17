'use strict';

var util = require('util');

var constants = require('../common/constants');
var errors    = require('../common/errors');
var storage   = require('../common/storage');

var LegacyVFS = require('../v0.10/avfs');

constants.F_OK = 0;
constants.R_OK = 4;
constants.W_OK = 2;
constants.X_OK = 1;

function VirtualFS() {
  LegacyVFS.apply(this, arguments);

  ['F_OK', 'R_OK', 'W_OK', 'X_OK'].forEach(function (key) {
    Object.defineProperty(this, key, {
      value:      constants[key],
      enumerable: true,
      writable:   false
    });
  }.bind(this));
}

util.inherits(VirtualFS, LegacyVFS);

VirtualFS.prototype.accessSync = function (path, mode) {
  if (typeof path !== 'string') {
    throw new TypeError('path must be a string');
  }

  var file = storage.get(this.files, 'access', path);

  var read  = (mode & constants.R_OK);
  var write = (mode & constants.W_OK);
  var exec  = (mode & constants.X_OK);

  if ((read && !file.isReadable()) || (write && !file.isWritable()) || (exec && !file.isExecutable())) {
    throw errors.EACCES('access', path);
  }
};

module.exports = VirtualFS;
