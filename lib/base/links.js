'use strict';

var path = require('path');

var assign = require('object-assign');

var AVFSError = require('../common/avfs-error');

module.exports = function (storage, constants) {
  var elements = require('../common/elements')(constants);
  var parsers  = require('../common/parsers')(constants);

  var exists = require('./exists')(storage);

  var Stats = require('../common/components/stats')(constants);

  return {
    lchmod: function (filepath, mode) {
      if (typeof filepath !== 'string') {
        throw new AVFSError('path:type');
      }

      if (typeof mode !== 'string' && typeof mode !== 'number') {
        throw new AVFSError('mode:type');
      }

      try {
        var file = storage.get(filepath, false);

        if (process.getuid() !== 0 && process.getuid() !== file.get('uid')) {
          throw new AVFSError('EPERM');
        }

        file.set('mode', parsers.mode(mode));
      } catch (error) {
        throw assign(error, {syscall: 'chmod', path: filepath});
      }
    },
    lchown: function (filepath, uid, gid) {
      if (typeof filepath !== 'string') {
        throw new AVFSError('path:type');
      }

      if (typeof uid !== 'number' || uid < 0) {
        throw new AVFSError('uid:type');
      }

      if (typeof gid !== 'number' || gid < 0) {
        throw new AVFSError('gid:type');
      }

      try {
        var file   = storage.get(filepath, false);
        var user   = process.getuid();
        var groups = process.getgroups();

        if (user !== 0 && (uid !== file.get('uid') || uid !== user || groups.indexOf(gid) === -1)) {
          throw new AVFSError('EPERM');
        }

        file.set('uid', uid);
        file.set('gid', gid);
      } catch (error) {
        throw assign(error, {syscall: 'chown', path: filepath});
      }
    },
    link: function (srcpath, dstpath) {
      if (typeof srcpath !== 'string') {
        throw new AVFSError('srcpath:type');
      }

      if (typeof dstpath !== 'string') {
        throw new AVFSError('dstpath:type');
      }

      try {
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
      } catch (error) {
        throw assign(error, {syscall: 'link', path: srcpath, dest: dstpath});
      }
    },
    lstat: function (filepath) {
      if (typeof filepath !== 'string') {
        throw new AVFSError('path:type');
      }

      try {
        return new Stats(storage.get(filepath, false));
      } catch (error) {
        throw assign(error, {syscall: 'lstat', path: filepath});
      }
    },
    readlink: function (linkpath) {
      if (typeof linkpath !== 'string') {
        throw new AVFSError('path:type');
      }

      try {
        var link = storage.get(linkpath, false);

        if (link.get('type') !== constants.S_IFLNK) {
          throw new AVFSError('EINVAL');
        }

        return link.get('target');
      } catch (error) {
        throw assign(error, {syscall: 'readlink', path: linkpath});
      }
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
        base = path.resolve(base, elems[index++]);

        if (cache && cache.hasOwnProperty(base)) {
          if (cache[base] !== base) {
            path.resolve(cache[base]);

            var cachedElems = parsers.path(cache[base]);

            elems = cachedElems.concat(elems.slice(index));

            cachedElems.splice(-1);

            base  = path.sep + cachedElems.join(path.sep);
            index = cachedElems.length;
          }
        } else {
          var elem = null;

          try {
            elem = storage.get(base, false);
          } catch (error) {
            throw assign(error, {syscall: 'lstat', path: filepath});
          }

          if (elem.get('type') === constants.S_IFLNK) {
            var target = parsers.path(elem.get('target'));

            if (cache) {
              cache[base] = path.sep + target.join(path.sep);
            }

            base = path.sep + target.join(path.sep);

            elems = target.concat(elems.slice(index));
            index = target.length;
          } else if (cache) {
            cache[base] = base;
          }
        }
      }

      return base;
    },
    // TODO: type parameter support
    symlink: function (srcpath, dstpath) {
      if (typeof srcpath !== 'string') {
        throw new AVFSError('srcpath:type');
      }

      if (typeof dstpath !== 'string') {
        throw new AVFSError('dstpath:type');
      }

      try {
        if (exists.exists(dstpath)) {
          throw new AVFSError('EEXIST', {path: srcpath});
        }

        storage.set(dstpath, elements.symlink(parsers.mode('0777'), srcpath));
      } catch (error) {
        throw assign(error, {syscall: 'symlink', path: srcpath, dest: dstpath});
      }
    },
    unlink: function (filepath) {
      if (typeof filepath !== 'string') {
        throw new AVFSError('path:type');
      }

      try {
        var file = storage.get(filepath);

        if (file.get('type') === constants.S_IFDIR) {
          throw new AVFSError('EISDIR');
        }

        file.set('nlink', file.get('nlink') - 1);

        storage.unset(filepath);
      } catch (error) {
        throw assign(error, {syscall: 'unlink', path: filepath});
      }
    }
  };
};
