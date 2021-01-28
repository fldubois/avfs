'use strict';

var assign = require('object-assign');

var AVFSError = require('../common/avfs-error');

module.exports = function (storage, constants) {
  var parsers = require('../common/parsers')(constants);

  return {
    chmod: function (path, mode) {
      if (typeof path !== 'string') {
        throw new AVFSError('path:type');
      }

      if (typeof mode !== 'string' && typeof mode !== 'number') {
        throw new AVFSError('mode:type');
      }

      try {
        var file = storage.get(path);

        if (process.getuid() !== 0 && process.getuid() !== file.get('uid')) {
          throw new AVFSError('EPERM');
        }

        file.set('mode', parsers.mode(mode));
      } catch (error) {
        throw assign(error, {syscall: 'chmod', path: path});
      }
    },
    chown: function (path, uid, gid) {
      if (typeof path !== 'string') {
        throw new AVFSError('path:type');
      }

      if (typeof uid !== 'number' || uid < 0) {
        throw new AVFSError('uid:type');
      }

      if (typeof gid !== 'number' || gid < 0) {
        throw new AVFSError('gid:type');
      }

      try {
        var file   = storage.get(path);
        var user   = process.getuid();
        var groups = process.getgroups();

        if (user !== 0 && (uid !== file.get('uid') || uid !== user || groups.indexOf(gid) === -1)) {
          throw new AVFSError('EPERM');
        }

        file.set('uid', uid);
        file.set('gid', gid);
      } catch (error) {
        throw assign(error, {syscall: 'chown', path: path});
      }
    }
  };
};
