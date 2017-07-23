'use strict';

var AVFSError = require('../avfs-error');

module.exports = function (storage, constants) {
  var parsers = require('../parsers')(constants);

  return {
    chmod: function (path, mode) {
      var file = storage.get(path);

      if (process.getuid() !== 0 && process.getuid() !== file.get('uid')) {
        throw new AVFSError('EPERM');
      }

      file.set('mode', parsers.mode(mode));
    },
    chown: function (path, uid, gid) {
      var file   = storage.get(path);
      var user   = process.getuid();
      var groups = process.getgroups();

      if (user !== 0 && (uid !== file.get('uid') || uid !== user || groups.indexOf(gid) === -1)) {
        throw new AVFSError('EPERM');
      }

      file.set('uid', uid);
      file.set('gid', gid);
    }
  };
};
