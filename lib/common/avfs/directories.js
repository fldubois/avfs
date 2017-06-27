'use strict';

var elements = require('../elements');
var parsers  = require('../parsers');

var AVFSError = require('../avfs-error');

module.exports = function (storage, constants) {
  var exists = require('./exists')(storage);

  return {
    mkdir: function (path, mode) {
      if (exists.exists(path)) {
        throw new AVFSError('EEXIST');
      }

      storage.set('mkdir', path, elements.directory(parsers.mode(mode, '0777')));
    },
    readdir: function (path) {
      var directory = storage.get('readdir', path);

      if (directory.get('type') !== constants.S_IFDIR) {
        throw new AVFSError('ENOTDIR');
      }

      return Object.keys(directory.get('content'));
    },
    rmdir: function (path) {
      var directory = storage.get('rmdir', path);

      if (directory.get('type') !== constants.S_IFDIR) {
        throw new AVFSError('ENOTDIR');
      }

      storage.unset('rmdir', path);
    }
  };
};
