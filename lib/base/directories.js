'use strict';

var assign = require('object-assign');

var AVFSError = require('../common/avfs-error');

var MKDTEMP_LENGTH = 6;

module.exports = function (storage, constants) {
  var elements = require('../common/elements')(constants);
  var parsers  = require('../common/parsers')(constants);

  var exists = require('./exists')(storage);

  var directories = {
    mkdir: function (path, mode) {
      if (typeof path !== 'string') {
        throw new AVFSError('path:type');
      }

      try {
        if (exists.exists(path)) {
          throw new AVFSError('EEXIST');
        }

        storage.set(path, elements.directory(parsers.mode(mode, '0777')));
      } catch (error) {
        throw assign(error, {syscall: 'mkdir', path: path});
      }
    },
    mkdtemp: function (prefix) {
      var alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var random   = [];

      for (var i = 0; i < MKDTEMP_LENGTH; i++) {
        random.push(alphabet.charAt(Math.floor(Math.random() * alphabet.length)));
      }

      var name = (prefix.charAt(0) !== '/' ? '/' : '') + prefix + random.join('');

      try {
        directories.mkdir(name, '0700');
      } catch (error) {
        throw assign(error, {syscall: 'mkdtemp'});
      }

      return name;
    },
    readdir: function (path) {
      if (typeof path !== 'string') {
        throw new AVFSError('path:type');
      }

      try {
        var directory = storage.get(path);

        if (directory.get('type') !== constants.S_IFDIR) {
          throw new AVFSError('ENOTDIR');
        }

        return Object.keys(directory.get('content'));
      } catch (error) {
        throw assign(error, {syscall: 'scandir', path: path});
      }
    },
    rmdir: function (path) {
      if (typeof path !== 'string') {
        throw new AVFSError('path:type');
      }

      try {
        var directory = storage.get(path);

        if (directory.get('type') !== constants.S_IFDIR) {
          throw new AVFSError('ENOTDIR');
        }

        storage.unset(path);
      } catch (error) {
        throw assign(error, {syscall: 'rmdir', path: path});
      }
    }
  };

  return directories;
};
