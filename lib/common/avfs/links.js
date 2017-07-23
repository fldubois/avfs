'use strict';

var path = require('path');

var AVFSError = require('../avfs-error');

module.exports = function (storage, constants) {
  var elements = require('../elements')(constants);
  var parsers  = require('../parsers')(constants);

  var exists = require('./exists')(storage);

  var Stats = require('../components/stats')(constants);

  return {
    lchmod: function (filepath, mode) {
      var file = storage.get(filepath, false);

      if (process.getuid() !== 0 && process.getuid() !== file.get('uid')) {
        throw new AVFSError('EPERM');
      }

      file.set('mode', parsers.mode(mode));
    },
    lchown: function (filepath, uid, gid) {
      var file   = storage.get(filepath, false);
      var user   = process.getuid();
      var groups = process.getgroups();

      if (user !== 0 && (uid !== file.get('uid') || uid !== user || groups.indexOf(gid) === -1)) {
        throw new AVFSError('EPERM');
      }

      file.set('uid', uid);
      file.set('gid', gid);
    },
    link: function (srcpath, dstpath) {
      var file = storage.get(srcpath);

      if (file.get('type') === constants.S_IFDIR) {
        throw new AVFSError('EPERM');
      }

      var parent   = storage.get(dstpath, 1);
      var filename = path.basename(dstpath);

      if (parent.get('type') !== constants.S_IFDIR) {
        throw new AVFSError('ENOTDIR');
      }

      if (parent.get('content').hasOwnProperty(filename)) {
        throw new AVFSError('EEXIST');
      }

      file.set('nlink', file.get('nlink') + 1);

      parent.get('content')[filename] = file;
    },
    lstat: function (filepath) {
      return new Stats(storage.get(filepath, false));
    },
    readlink: function (linkpath) {
      var link = storage.get(linkpath, false);

      if (link.get('type') !== constants.S_IFLNK) {
        throw new AVFSError('EINVAL');
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

        var elem = storage.get(base, false);

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
        throw new AVFSError('EEXIST');
      }

      storage.set(dstpath, elements.symlink(parsers.mode('0777'), srcpath));
    },
    unlink: function (filepath) {
      var file = storage.get(filepath);

      if (file.get('type') === constants.S_IFDIR) {
        throw new AVFSError('EISDIR');
      }

      file.set('nlink', file.get('nlink') - 1);

      storage.unset(filepath);
    }
  };
};
