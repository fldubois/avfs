'use strict';

var assign = require('object-assign');

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

var nullCheck = function (data, filepath) {
  if (typeof data === 'string') {
    filepath = data;
    data     = {};
  }

  if (('' + filepath).indexOf('\u0000') !== -1) {
    var message = 'Path must be a string without null bytes.';

    data = assign({}, data);

    if (data.hasOwnProperty('message')) {
      message = data.message;

      delete data.message;
    }

    throw createError(message, data);
  }
};

module.exports = {
  createError: createError,
  nullCheck:   nullCheck
};
