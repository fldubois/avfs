'use strict';

var AVFSError = require('../avfs-error');

module.exports = function (storage, constants) {
  return {
    access: function (path, mode) {
      var file = storage.get(path);

      var read  = (mode & constants.R_OK);
      var write = (mode & constants.W_OK);
      var exec  = (mode & constants.X_OK);

      if ((read && !file.isReadable()) || (write && !file.isWritable()) || (exec && !file.isExecutable())) {
        throw new AVFSError('EACCES');
      }
    }
  };
};
