'use strict';

var parsers = require('../parsers');

module.exports = function (storage, errors) {
  return {
    chmod: function (path, mode) {
      var file = storage.get('chmod', path);

      if (process.getuid() !== 0 && process.getuid() !== file.get('uid')) {
        throw errors.EPERM({syscall: 'chmod', path: path});
      }

      file.set('mode', parsers.mode(mode));
    },
    chown: function (path, uid, gid) {
      var file   = storage.get('chown', path);
      var user   = process.getuid();
      var groups = process.getgroups();

      if (user !== 0 && (uid !== file.get('uid') || uid !== user || groups.indexOf(gid) === -1)) {
        throw errors.EPERM({syscall: 'chown', path: path});
      }

      file.set('uid', uid);
      file.set('gid', gid);
    }
  };
};
