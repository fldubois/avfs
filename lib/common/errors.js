'use strict';

module.exports = {
  createError: function (message, data) {
    var error = new Error(message);

    Object.keys(data).forEach(function (property) {
      error[property] = data[property];
    });

    error.stack = error.stack.split('\n').filter(function (line) {
      return line.indexOf(__filename + ':') === -1;
    }).join('\n');

    return error;
  },
  nullCheck: function (data, filepath, callback) {
    if (typeof data === 'string') {
      callback = filepath;
      filepath = data;
      data     = {};
    }

    if (('' + filepath).indexOf('\u0000') !== -1) {
      var error = new Error('Path must be a string without null bytes.');

      Object.keys(data).forEach(function (property) {
        error[property] = data[property];
      });

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
  }
};
