'use strict';

module.exports = function (storage, errors, constants, handles) {
  var descriptors = require('./descriptors')(storage, errors, constants, handles);
  var rw          = require('./read-write')(storage, errors, constants, handles);

  return {
    appendFile: function (path, data, options) {
      if (!options) {
        options = {encoding: 'utf8', mode: '0666', flag: 'a'};
      } else if (typeof options === 'string') {
        options = {encoding: options, mode: '0666', flag: 'a'};
      }

      if (!options.hasOwnProperty('flag')) {
        options.flag = 'a';
      }

      this.writeFile(path, data, options);
    },
    readFile: function (path, options) {
      if (!options) {
        options = {encoding: null, flag: 'r'};
      } else if (typeof options === 'string') {
        options = {encoding: options, flag: 'r'};
      }

      descriptors.open(path, options.flag || 'r');

      var file = storage.get('open', path);

      if (file.get('type') === constants.S_IFDIR) {
        throw errors.EISDIR({syscall: 'read'});
      }

      var content = file.get('content');
      var buffer  = new Buffer(content.length);

      content.copy(buffer);

      return options.encoding ? buffer.toString(options.encoding) : buffer;
    },
    rename: function (oldPath, newPath) {
      if (newPath.indexOf(oldPath) !== -1) {
        throw errors.EINVAL({syscall: 'rename', path: oldPath});
      }

      var oldDirectory = storage.get({syscall: 'rename', path: oldPath}, oldPath, 1);
      var newDirectory = storage.get({syscall: 'rename', path: oldPath}, newPath, 1);

      if (!oldDirectory.isWritable() || !newDirectory.isWritable()) {
        throw errors.EACCES({syscall: 'rename', path: oldPath});
      }

      var file = storage.get('rename', oldPath);

      storage.set({syscall: 'rename', path: oldPath}, newPath, file);

      storage.unset({syscall: 'rename', path: oldPath}, oldPath);
    },
    truncate: function (path, length) {
      var fd = null;

      try {
        fd = descriptors.open(path, 'r+');
        descriptors.ftruncate(fd, length);
      } finally {
        if (fd !== null) {
          descriptors.close(fd);
        }
      }
    },
    writeFile: function (path, data, options) {
      if (!options) {
        options = {encoding: null, mode: '0666', flag: 'w'};
      } else if (typeof options === 'string') {
        options = {encoding: options, mode: '0666', flag: 'w'};
      }

      var content = Buffer.isBuffer(data) ? data : new Buffer(data.toString(), options.encoding || 'utf8');
      var fd      = descriptors.open(path, options.flag || 'w', options.mode);

      rw.write(fd, content, 0, content.length, null);

      descriptors.close(fd);
    }
  };
};
