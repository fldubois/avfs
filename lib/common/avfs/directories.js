'use strict';

var parsers = require('../parsers');

var AVFSError = require('../avfs-error');

var MKDTEMP_LENGTH = 6;

module.exports = function (storage, constants) {
  var elements = require('../elements')(constants);

  var exists = require('./exists')(storage);

  var directories = {
    mkdir: function (path, mode) {
      if (exists.exists(path)) {
        throw new AVFSError('EEXIST');
      }

      storage.set(path, elements.directory(parsers.mode(mode, '0777')));
    },
    mkdtemp: function (prefix) {
      var alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var random   = [];

      for (var i = 0; i < MKDTEMP_LENGTH; i++) {
        random.push(alphabet.charAt(Math.floor(Math.random() * alphabet.length)));
      }

      var name = (prefix.charAt(0) !== '/' ? '/' : '') + prefix + random.join('');

      directories.mkdir(name, '0700');

      return name;
    },
    readdir: function (path) {
      var directory = storage.get(path);

      if (directory.get('type') !== constants.S_IFDIR) {
        throw new AVFSError('ENOTDIR');
      }

      return Object.keys(directory.get('content'));
    },
    rmdir: function (path) {
      var directory = storage.get(path);

      if (directory.get('type') !== constants.S_IFDIR) {
        throw new AVFSError('ENOTDIR');
      }

      storage.unset(path);
    }
  };

  return directories;
};
