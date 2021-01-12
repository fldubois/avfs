'use strict';

var AVFSError = require('../common/avfs-error');

module.exports = function (storage, constants, handles) {
  var descriptors = require('./descriptors')(storage, constants, handles);
  var rw          = require('./read-write')(storage, constants, handles);

  var files = {
    appendFile: function (path, data, options) {
      if (typeof path !== 'string') {
        throw new AVFSError('path:type');
      }

      if (!options) {
        options = {encoding: 'utf8', mode: '0666', flag: 'a'};
      } else if (typeof options === 'string') {
        options = {encoding: options, mode: '0666', flag: 'a'};
      } else if (typeof options !== 'object') {
        throw new AVFSError('options:type', {type: typeof options});
      }

      if (options.encoding && !Buffer.isEncoding(options.encoding)) {
        throw new AVFSError('options:encoding', {encoding: options.encoding});
      }

      if (!options.hasOwnProperty('flag')) {
        options.flag = 'a';
      }

      files.writeFile(path, data, options);
    },
    readFile: function (path, options) {
      if (typeof path !== 'string') {
        throw new AVFSError('path:type');
      }

      if (!options) {
        options = {encoding: null, flag: 'r'};
      } else if (typeof options === 'string') {
        options = {encoding: options, flag: 'r'};
      } else if (typeof options !== 'object') {
        throw new AVFSError('options:type', {type: typeof options});
      }

      if (options.encoding && !Buffer.isEncoding(options.encoding)) {
        throw new AVFSError('options:encoding', {encoding: options.encoding});
      }

      descriptors.open(path, options.flag || 'r');

      var file = storage.get(path);

      if (file.get('type') === constants.S_IFDIR) {
        throw new AVFSError('EISDIR');
      }

      var content = file.get('content');
      var buffer  = new Buffer(content.length);

      content.copy(buffer);

      return options.encoding ? buffer.toString(options.encoding) : buffer;
    },
    rename: function (oldPath, newPath) {
      if (typeof oldPath !== 'string') {
        throw new AVFSError('old:type');
      }

      if (typeof newPath !== 'string') {
        throw new AVFSError('new:type');
      }

      if (newPath.indexOf(oldPath) === 0) {
        throw new AVFSError('EINVAL');
      }

      var oldDirectory = storage.get(oldPath, 1);
      var newDirectory = storage.get(newPath, 1);

      if (!oldDirectory.isWritable() || !newDirectory.isWritable()) {
        throw new AVFSError('EACCES');
      }

      var file = storage.get(oldPath);

      storage.set(newPath, file);

      storage.unset(oldPath);
    },
    truncate: function (path, length) {
      if (typeof path !== 'string') {
        throw new AVFSError('path:type');
      }

      if (typeof length !== 'undefined' && length !== parseInt(length, 10)) {
        throw new AVFSError('length:type');
      }

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
      if (typeof path !== 'string') {
        throw new AVFSError('path:type');
      }

      if (!options) {
        options = {encoding: null, mode: '0666', flag: 'w'};
      } else if (typeof options === 'string') {
        options = {encoding: options, mode: '0666', flag: 'w'};
      } else if (typeof options !== 'object') {
        throw new AVFSError('options:type', {type: typeof options});
      }

      if (options.encoding && !Buffer.isEncoding(options.encoding)) {
        throw new AVFSError('options:encoding', {encoding: options.encoding});
      }

      var content = Buffer.isBuffer(data) ? data : new Buffer(data.toString(), options.encoding || 'utf8');
      var fd      = descriptors.open(path, options.flag || 'w', options.mode);

      rw.write(fd, content, 0, content.length, null);

      descriptors.close(fd);
    }
  };

  return files;
};
