'use strict';

var constants = require('./constants');

var inode = 0;

function element(type, mode, metas) {
  var now = new Date();

  var descriptors = {
    mode: {
      value:        mode,
      configurable: false,
      enumerable:   false,
      writable:     true
    },
    type: {
      value:        type,
      configurable: false,
      enumerable:   false,
      writable:     false
    },
    inode: {
      value:        inode++,
      configurable: false,
      enumerable:   false,
      writable:     false
    },
    uid: {
      value:        0,
      configurable: false,
      enumerable:   false,
      writable:     true
    },
    gid: {
      value:        0,
      configurable: false,
      enumerable:   false,
      writable:     true
    },
    nlink: {
      value:        1,
      configurable: false,
      enumerable:   false,
      writable:     true
    },
    atime: {
      value:        now,
      configurable: false,
      enumerable:   false,
      writable:     true
    },
    ctime: {
      value:        now,
      configurable: false,
      enumerable:   false,
      writable:     true
    },
    mtime: {
      value:        now,
      configurable: false,
      enumerable:   false,
      writable:     true
    }
  };

  Object.keys(metas).forEach(function (meta) {
    descriptors[meta] = {
      value:        metas[meta],
      configurable: false,
      enumerable:   false,
      writable:     true
    };
  });

  var properties = Object.defineProperties({}, descriptors);

  return {
    get: function (name) {
      return properties[name];
    },
    set: function (name, value) {
      var time = new Date();

      if (name === 'content') {
        properties.mtime = time;
      }

      if (['content', 'mode', 'gid', 'uid', 'nlink'].indexOf(name) !== -1) {
        properties.ctime = time;
      }

      properties[name] = value;
    }
  };
}

module.exports.directory = function (mode, children) {
  return element(constants.S_IFDIR, mode, {
    content: children || {}
  });
};

module.exports.file = function (mode, content) {
  return element(constants.S_IFREG, mode, {
    content: content
  });
};

module.exports.symlink = function (mode, target) {
  return element(constants.S_IFLNK, mode, {
    target: target
  });
};
