'use strict';

var MKDTEMP_LENGTH = 6;

module.exports = function () {
  return {
    mkdtemp: function (prefix) {
      var alphabet = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
      var random   = [];

      for (var i = 0; i < MKDTEMP_LENGTH; i++) {
        random.push(alphabet.charAt(Math.floor(Math.random() * alphabet.length)));
      }

      return prefix + random.join('');
    }
  };
};
