'use strict';

var util = require('util');

module.exports = function () {
  return {
    toUnixTimestamp: function (time) {
      if (typeof time === 'string' && /^[0-9]+$/.test(time)) {
        return parseInt(time, 10);
      }

      if (typeof time === 'number') {
        if (!Number.isFinite(time) || time < 0) {
          return Date.now() / 1000;
        }

        return time;
      }

      if (util.isDate(time)) {
        return time.getTime() / 1000;
      }

      throw new Error('Cannot parse time: ' + time);
    }
  };
};
