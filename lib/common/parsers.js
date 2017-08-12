'use strict';

var os   = require('os');
var path = require('path');

module.exports = function (constants) {
  return {
    flags: function (flag) {
      if (typeof flag !== 'string') {
        return flag;
      }

      switch (flag) {
        case 'r':   // fall through
        case 'rs':  return constants.O_RDONLY;

        case 'r+':  // fall through
        case 'rs+': return constants.O_RDWR;

        case 'w':  return constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC;
        case 'wx': // fall through
        case 'xw': return constants.O_WRONLY | constants.O_CREAT | constants.O_TRUNC  | constants.O_EXCL;

        case 'w+':  return constants.O_RDWR  | constants.O_CREAT | constants.O_TRUNC;
        case 'wx+': // fall through
        case 'xw+': return constants.O_RDWR  | constants.O_CREAT | constants.O_TRUNC  | constants.O_EXCL;

        case 'a':  return constants.O_WRONLY | constants.O_CREAT | constants.O_APPEND;
        case 'ax': // fall through
        case 'xa': return constants.O_WRONLY | constants.O_CREAT | constants.O_APPEND | constants.O_EXCL;

        case 'a+':  return constants.O_RDWR  | constants.O_CREAT | constants.O_APPEND;
        case 'ax+': // fall through
        case 'xa+': return constants.O_RDWR  | constants.O_CREAT | constants.O_APPEND | constants.O_EXCL;

        default: throw new Error('Unknown file open flag: ' + flag);
      }
    },
    mode: function parseMode(mode, def) {
      switch (typeof mode) {
        case 'number':
          return mode;
        case 'string':
          return parseInt(mode, 8);
        default:
          return def ? parseMode(def) : null;
      }
    },
    path: function (filepath) {
      var normalized = path.normalize(filepath).replace(/\/|\\/g, path.sep).replace(new RegExp('^' + path.sep), '');

      return (normalized.length > 0) ? normalized.split(path.sep) : [];
    },
    url: function (url) {
      if (typeof url !== 'object' || url === null) {
        return url;
      }

      if (typeof url.protocol !== 'string' || typeof url.hostname !== 'string' || typeof url.pathname !== 'string') {
        return url;
      }

      if (url.protocol !== 'file:') {
        throw new TypeError('Only `file:` URLs are supported');
      }

      if (url.hostname !== '') {
        var message = 'File URLs on ' + os.platform() + ' must use hostname \'localhost\' or not specify any hostname';

        throw new TypeError(message);
      }

      var pathname = url.pathname;

      if (pathname.toLowerCase().indexOf('%2f') !== -1) {
        throw new TypeError('Path must not include encoded / characters');
      }

      return decodeURIComponent(pathname);
    }
  };
};
