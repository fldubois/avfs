'use strict';

var AVFSError = require('../common/avfs-error');

module.exports = function (storage, constants, options) {
  var Stats = require('../common/components/stats')(constants, options);

  return {
    stat: function (path) {
      if (typeof path !== 'string') {
        throw new AVFSError('path:type');
      }

      return new Stats(storage.get(path));
    },
    utimes: function (path, atime, mtime) {
      if (typeof atime !== 'number' && !(atime instanceof Date)) {
        throw new AVFSError('atime:type');
      }

      if (typeof mtime !== 'number' && !(mtime instanceof Date)) {
        throw new AVFSError('mtime:type');
      }

      if (typeof path !== 'string') {
        throw new AVFSError('path:type');
      }

      var file = storage.get(path);

      file.set('atime', (typeof atime === 'number') ? new Date(atime * 1000) : atime);
      file.set('mtime', (typeof mtime === 'number') ? new Date(mtime * 1000) : mtime);
    }
  };
};
