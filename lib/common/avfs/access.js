'use strict';

module.exports = function (storage, errors, constants) {
  return {
    access: function (path, mode) {
      var file = storage.get('access', path);

      var read  = (mode & constants.R_OK);
      var write = (mode & constants.W_OK);
      var exec  = (mode & constants.X_OK);

      if ((read && !file.isReadable()) || (write && !file.isWritable()) || (exec && !file.isExecutable())) {
        throw errors.EACCES({syscall: 'access', path: path});
      }
    }
  };
};
