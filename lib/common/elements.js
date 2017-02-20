'use strict';

var types = require('./types');

function element(type, mode, metas) {
  var properties = {
    '@mode': {
      value:        mode,
      configurable: false,
      enumerable:   false,
      writable:     true
    },
    '@type': {
      value:        type,
      configurable: false,
      enumerable:   false,
      writable:     false
    }
  };

  if (typeof metas === 'object') {
    Object.keys(metas).forEach(function (meta) {
      properties['@' + meta] = {
        value:        metas[meta],
        configurable: false,
        enumerable:   false,
        writable:     true
      };
    });
  }

  return Object.defineProperties({}, properties);
}

module.exports.directory = function (mode, children) {
  var directory = element(types.DIR, mode);

  if (typeof children === 'object') {
    Object.keys(children).forEach(function (child) {
      directory[child] = children[child];
    });
  }

  return directory;
};

module.exports.file = function (mode, content) {
  return element(types.FILE, mode, {
    content: content
  });
};
