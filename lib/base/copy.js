'use strict';

var assign = require('object-assign');

var AVFSError = require('../common/avfs-error');

module.exports = function (storage, constants, handles) {
  var descriptors = require('./descriptors')(storage, constants, handles);
  var rw          = require('./read-write')(storage, constants, handles);

  var files = {
    copyFile: function (src, dest, mode) {
      if (typeof src !== 'string') {
        throw new AVFSError('src:type');
      }

      if (typeof dest !== 'string') {
        throw new AVFSError('dest:type');
      }

      try {
        var file = storage.get(src);

        var flags = (mode === constants.COPYFILE_EXCL) ? 'wx' : 'w';

        var fd = descriptors.open(dest, flags, file.get('mode'));

        descriptors.fchmod(fd, file.get('mode'));

        rw.write(fd, file.get('content'), 0, file.get('content').length, null);

        descriptors.close(fd);
      } catch (error) {
        throw assign(error, {syscall: 'copyfile', path: src, dest: dest});
      }
    }
  };

  return files;
};
