'use strict';

var path = require('path');

var elements = require('../elements');
var parsers  = require('../parsers');

module.exports = function (storage, errors, constants) {
  var exists = require('./exists')(storage, errors);

  return {
    link: function (srcpath, dstpath) {
      var file = storage.get('link', srcpath);

      if (file.get('type') === constants.S_IFDIR) {
        throw errors.EPERM({syscall: 'link', path: dstpath});
      }

      var parent   = storage.get({syscall: 'link', path: srcpath}, dstpath, 1);
      var filename = path.basename(dstpath);

      if (parent.get('type') !== constants.S_IFDIR) {
        throw errors.ENOTDIR({syscall: 'link', path: srcpath});
      }

      if (parent.get('content').hasOwnProperty(filename)) {
        throw errors.EEXIST({syscall: 'link', path: dstpath});
      }

      file.set('nlink', file.get('nlink') + 1);

      parent.get('content')[filename] = file;
    },
    readlink: function (linkpath) {
      var link = storage.get('readlink', linkpath, false);

      if (link.get('type') !== constants.S_IFLNK) {
        throw errors.EINVAL({syscall: 'readlink', path: linkpath});
      }

      return link.get('target');
    },
    symlink: function (srcpath, dstpath) {
      if (exists.exists(dstpath)) {
        throw errors.EEXIST({syscall: 'symlink', path: srcpath});
      }

      storage.set('symlink', dstpath, elements.symlink(parsers.mode('0777'), srcpath));
    },
    unlink: function (filepath) {
      var file = storage.get('unlink', filepath);

      if (file.get('type') === constants.S_IFDIR) {
        throw errors.EISDIR({syscall: 'unlink', path: filepath});
      }

      file.set('nlink', file.get('nlink') - 1);

      storage.unset('unlink', filepath);
    }
  };
};
