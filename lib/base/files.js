'use strict';

var assign = require('object-assign');

var AVFSError = require('../common/avfs-error');

var getOptions = function (options, defaults) {
  if (typeof options === 'undefined' || options === null) {
    return defaults;
  }

  if (typeof options !== 'object' && typeof options !== 'string') {
    throw new AVFSError('options:type', {type: typeof options});
  }

  var opts = assign(defaults, typeof options === 'string' ? {encoding: options} : options);

  if (opts.encoding && !Buffer.isEncoding(opts.encoding)) {
    throw new AVFSError('options:encoding', {encoding: opts.encoding});
  }

  return opts;
};

module.exports = function (storage, constants, handles) {
  var descriptors = require('./descriptors')(storage, constants, handles);
  var rw          = require('./read-write')(storage, constants, handles);

  var files = {
    appendFile: function (path, data, options) {
      if (typeof path !== 'string') {
        throw new AVFSError('path:type');
      }

      files.writeFile(path, data, getOptions(options, {encoding: 'utf8', mode: '0666', flag: 'a'}));
    },
    readFile: function (path, options) {
      if (typeof path !== 'string') {
        throw new AVFSError('path:type');
      }

      options = getOptions(options, {encoding: null, flag: 'r'});

      var fd     = descriptors.open(path, options.flag);
      var length = handles[fd].file.get('content').length || 0;
      var buffer = new Buffer(length);

      rw.read(fd, buffer, 0, length, 0);

      return options.encoding ? buffer.toString(options.encoding) : buffer;
    },
    rename: function (oldPath, newPath) {
      if (typeof oldPath !== 'string') {
        throw new AVFSError('old:type');
      }

      if (typeof newPath !== 'string') {
        throw new AVFSError('new:type');
      }

      try {
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
      } catch (error) {
        throw assign(error, {syscall: 'rename', path: oldPath, dest: newPath});
      }
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

      options = getOptions(options, {encoding: 'utf8', mode: '0666', flag: 'w'});

      var content = Buffer.isBuffer(data) ? data : new Buffer(data.toString(), options.encoding);
      var fd      = descriptors.open(path, options.flag, options.mode);

      rw.write(fd, content, 0, content.length, null);

      descriptors.close(fd);
    }
  };

  return files;
};
