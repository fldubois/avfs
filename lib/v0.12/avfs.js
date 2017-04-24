'use strict';

var util = require('util');

var constants = require('../common/constants');
var errors    = require('../common/errors');
var storage   = require('../common/storage');

var LegacyVFS = require('../v0.10/avfs');

function VirtualFS() {
  LegacyVFS.apply(this, arguments);

  ['F_OK', 'R_OK', 'W_OK', 'X_OK'].forEach(function (key) {
    Object.defineProperty(this, key, {
      value:      constants[key],
      enumerable: true,
      writable:   false
    });
  }.bind(this));
}

util.inherits(VirtualFS, LegacyVFS);

VirtualFS.prototype.accessSync = function (path, mode) {
  if (typeof path !== 'string') {
    throw new TypeError('path must be a string');
  }

  var file = storage.get(this.files, 'access', path);

  var read  = (mode & constants.R_OK);
  var write = (mode & constants.W_OK);
  var exec  = (mode & constants.X_OK);

  if ((read && !file.isReadable()) || (write && !file.isWritable()) || (exec && !file.isExecutable())) {
    throw errors.EACCES({syscall: 'access', path: path});
  }
};

VirtualFS.prototype.writeSync = function (fd, buffer, offset, length, position) {
  if (Buffer.isBuffer(buffer)) {
    return LegacyVFS.prototype.writeSync.call(this, fd, buffer, offset, length, position);
  }

  //  fs.writeSync(fd, data[, position[, encoding]]);

  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('First argument must be file descriptor');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed() || !this.handles[fd].isWritable()) {
    throw errors.EBADF({syscall: 'write'});
  }

  var data     = buffer + '';
  var encoding = (Buffer.isEncoding(length)) ? length : 'utf8';

  position = (typeof offset === 'number' && offset >= 0) ? offset : null;

  var file    = this.handles[fd].file;
  var content = file.get('content');

  var pos = 0;

  if (this.handles[fd].flags & constants.O_APPEND) {
    pos = content.length;
  } else if (position !== null) {
    pos = position;
  } else {
    pos = this.handles[fd].write;
  }

  if (content.length < pos + data.length) {
    var tmp = new Buffer(pos + data.length);

    tmp.fill(' ', content.length, pos + data.length);

    content.copy(tmp, 0, 0, content.length);

    content = tmp;

    file.set('content', content);
  }

  content.write(data, pos, data.length, encoding);

  if (position === null) {
    this.handles[fd].write += data.length;
  }

  return data.length;
};

module.exports = VirtualFS;
