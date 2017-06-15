'use strict';

var elements = require('../elements');
var parsers  = require('../parsers');

module.exports = function (storage, errors, constants) {
  var exists = require('./exists')(storage, errors);

  return {
    mkdir: function (path, mode) {
      if (exists.exists(path)) {
        throw errors.EEXIST({syscall: 'mkdir', path: path});
      }

      storage.set('mkdir', path, elements.directory(parsers.mode(mode, '0777')));
    },
    readdir: function (path) {
      var directory = storage.get('readdir', path);

      if (directory.get('type') !== constants.S_IFDIR) {
        throw errors.ENOTDIR({syscall: 'readdir', path: path});
      }

      return Object.keys(directory.get('content'));
    },
    rmdir: function (path) {
      var directory = storage.get('rmdir', path);

      if (directory.get('type') !== constants.S_IFDIR) {
        throw errors.ENOTDIR({syscall: 'rmdir', path: path});
      }

      storage.unset('rmdir', path);
    }
  };
};
