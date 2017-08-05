'use strict';

var AVFSError = require('../common/avfs-error');

module.exports = function (storage, constants) {
  return {
    access: function (path, mode) {
      if (typeof path !== 'string') {
        throw new AVFSError('path:type');
      }

      var file = storage.get(path);

      if (typeof mode !== 'number') {
        mode = mode ? 1 : 0;
      }

      if ([constants.F_OK, constants.R_OK, constants.W_OK, constants.X_OK].indexOf(mode) === -1) {
        throw new AVFSError('EINVAL');
      }

      if (mode === constants.F_OK) {
        return void 0;
      }

      var read  = (mode & constants.R_OK);
      var write = (mode & constants.W_OK);
      var exec  = (mode & constants.X_OK);

      if ((read && !file.isReadable()) || (write && !file.isWritable()) || (exec && !file.isExecutable())) {
        throw new AVFSError('EACCES');
      }
    }
  };
};
