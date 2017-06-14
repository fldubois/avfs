'use strict';

module.exports = function (storage, errors) {
  return {
    exists: function (filepath) {
      if (typeof filepath !== 'string') {
        return false;
      }

      try {
        errors.nullCheck(filepath);

        storage.get('exists', filepath);

        return true;
      } catch (error) {
        return false;
      }
    }
  };
};
