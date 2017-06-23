'use strict';

var path = require('path');

var elements = require('../elements');
var parsers  = require('../parsers');

var Stats = require('../components/stats');

module.exports = function (storage, errors, constants) {
  var exists = require('./exists')(storage, errors);

  return {
    lchmod: function (filepath, mode) {
      var file = storage.get('chmod', filepath, false);

      if (process.getuid() !== 0 && process.getuid() !== file.get('uid')) {
        throw errors.EPERM({syscall: 'chmod', path: filepath});
      }

      file.set('mode', parsers.mode(mode));
    },
    lchown: function (filepath, uid, gid) {
      var file   = storage.get('chown', filepath, false);
      var user   = process.getuid();
      var groups = process.getgroups();

      if (user !== 0 && (uid !== file.get('uid') || uid !== user || groups.indexOf(gid) === -1)) {
        throw errors.EPERM({syscall: 'chown', path: filepath});
      }

      file.set('uid', uid);
      file.set('gid', gid);
    },
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
    lstat: function (filepath) {
      return new Stats(storage.get('lstat', filepath, false));
    },
    readlink: function (linkpath) {
      var link = storage.get('readlink', linkpath, false);

      if (link.get('type') !== constants.S_IFLNK) {
        throw errors.EINVAL({syscall: 'readlink', path: linkpath});
      }

      return link.get('target');
    },
    realpath: function (filepath, cache) {
      path.resolve(filepath);

      if (cache && cache.hasOwnProperty(filepath)) {
        return cache[filepath];
      }

      var base  = path.sep;
      var elems = parsers.path(filepath);
      var index = 0;

      while (index < elems.length) {
        base = path.resolve(base, elems[index]);

        if (cache && cache.hasOwnProperty(base)) {
          path.resolve(cache[base]);

          var cachedElems = parsers.path(cache[base]);

          elems = cachedElems.concat(elems.slice(index + 1));
          base  = path.sep + cachedElems.join(path.sep);
          index = cachedElems.length - 1;
        }

        var elem = storage.get('lstat', base, false);

        if (elem.get('type') === constants.S_IFLNK) {
          var target = parsers.path(elem.get('target'));

          base = path.sep + target.join(path.sep);

          elems = target.concat(elems.slice(index + 1));
          index = target.length - 1;
        }

        index++;
      }

      return base;
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
