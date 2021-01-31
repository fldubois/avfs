'use strict';

var AVFSError = require('./avfs-error');

var createError = function (message, data) {
  var error = new Error(message);

  Object.keys(data).forEach(function (property) {
    error[property] = data[property];
  });

  error.stack = error.stack.split('\n').filter(function (line) {
    return line.indexOf(__filename + ':') === -1;
  }).join('\n');

  return error;
};

var nullCheck = function (path) {
  if (('' + path).indexOf('\u0000') !== -1) {
    throw new AVFSError('path:null');
  }
};

module.exports = {
  createError: createError,
  nullCheck:   nullCheck
};
