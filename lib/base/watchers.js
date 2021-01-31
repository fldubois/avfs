'use strict';

var util = require('util');

var errors = require('../common/errors');

var AVFSError   = require('../common/avfs-error');
var FSWatcher   = require('../common/watchers/fs-watcher');
var StatWatcher = require('../common/watchers/stat-watcher');

module.exports = function () {
  var watchers = {};

  return {
    watchers: watchers,

    watch: function (filename, options, listener) {
      errors.nullCheck(filename);

      var defaults = {
        persistent: true
      };

      if (typeof options !== 'object') {
        listener = options;
        options  = defaults;
      } else {
        options = util._extend(defaults, options);
      }

      var watcher = new FSWatcher();

      watcher.start(filename, options.persistent);

      if (listener) {
        watcher.addListener('change', listener);
      }

      return watcher;
    },
    watchFile: function (filename, options, listener) {
      errors.nullCheck(filename);

      var defaults = {
        interval:   5007,
        persistent: true
      };

      if (typeof options !== 'object') {
        listener = options;
        options  = defaults;
      } else {
        options = util._extend(defaults, options);
      }

      if (!listener) {
        throw new AVFSError('listener:missing');
      }

      if (typeof watchers[filename] === 'undefined') {
        watchers[filename] = new StatWatcher();

        watchers[filename].start(filename, options.persistent, options.interval);
      }

      var watcher = watchers[filename];

      watcher.addListener('change', listener);

      return watcher;
    },
    unwatchFile: function (filename, listener) {
      errors.nullCheck(filename);

      if (typeof watchers[filename] !== 'undefined') {
        var watcher = watchers[filename];

        if (typeof listener === 'function') {
          watcher.removeListener('change', listener);
        } else {
          watcher.removeAllListeners('change');
        }

        if (watcher.listeners('change').length === 0) {
          watcher.stop();

          watchers[filename] = void 0;
        }
      }
    }
  };
};
