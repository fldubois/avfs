'use strict';

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

var nullCheck = function (data, filepath, callback) {
  if (typeof data === 'string') {
    callback = filepath;
    filepath = data;
    data     = {};
  }

  if (('' + filepath).indexOf('\u0000') !== -1) {
    var message = 'Path must be a string without null bytes.';

    if (data.hasOwnProperty('message')) {
      message = data.message;

      delete data.message;
    }

    var error = createError(message, data);

    if (typeof callback !== 'function') {
      throw error;
    }

    process.nextTick(callback, error);

    return false;
  }

  if (typeof callback === 'function') {
    process.nextTick(callback, null);
  }

  return true;
};

module.exports = {
  createError: createError,
  nullCheck:   nullCheck
};
