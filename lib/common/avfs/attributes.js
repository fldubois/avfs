'use strict';

var Stats = require('../components/stats');

module.exports = function (storage) {
  return {
    stat: function (path) {
      return new Stats(storage.get(path));
    },
    utimes: function (path, atime, mtime) {
      var file = storage.get(path);

      file.set('atime', (typeof atime === 'number') ? new Date(atime * 1000) : atime);
      file.set('mtime', (typeof mtime === 'number') ? new Date(mtime * 1000) : mtime);
    }
  };
};
