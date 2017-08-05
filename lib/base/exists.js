'use strict';

module.exports = function (storage) {
  return {
    exists: function (filepath) {
      if (typeof filepath !== 'string') {
        return false;
      }

      if (('' + filepath).indexOf('\u0000') !== -1) {
        return false;
      }

      try {
        storage.get(filepath);

        return true;
      } catch (error) {
        return false;
      }
    }
  };
};
