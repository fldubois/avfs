'use strict';

var path   = require('path');
var stream = require('stream');

var get   = require('lodash.get');
var set   = require('lodash.set');
var unset = require('lodash.unset');

var errors = require('./common/errors');
var flags  = require('./common/flags');
var types  = require('./common/types');

var Descriptor = require('./common/descriptor');

var getPathElements = function (filepath) {
  return path.normalize(filepath).replace(/\/|\\/g, path.sep).replace(new RegExp('^' + path.sep), '').split(path.sep);
};

var parseMode = function (mode, def) {
  switch (typeof mode) {
    case 'number':
      return mode;
    case 'string':
      return parseInt(mode, 8);
    default:
      /* istanbul ignore next */
      return def ? parseMode(def) : null;
  }
};

function VirtualFS() {
  this.files   = {};
  this.handles = {};
  this.next    = 0;
}

VirtualFS.prototype.appendFileSync = function (filename, data, options) {
  if (!options) {
    options = {encoding: 'utf8', mode: '0666', flag: 'a'};
  } else if (typeof options === 'string') {
    options = {encoding: options, mode: '0666', flag: 'a'};
  } else if (typeof options !== 'object') {
    throw new TypeError('Bad arguments');
  }

  if (!options.hasOwnProperty('flag')) {
    options.flag = 'a';
  }

  this.writeFileSync(filename, data, options);
};

// TODO: Check owner and group for mode writing permission
VirtualFS.prototype.chmodSync = function (filepath, mode) {
  if (typeof filepath !== 'string') {
    throw new TypeError('Bad argument');
  }

  if (typeof mode !== 'string' && typeof mode !== 'number') {
    throw new TypeError('Bad argument');
  }

  if (!this.existsSync(filepath)) {
    throw errors.ENOENT('chmod', filepath);
  }

  var file = get(this.files, getPathElements(filepath));

  file['@mode'] = parseMode(mode);
};

VirtualFS.prototype.closeSync = function (fd) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad argument');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed()) {
    throw errors.EBADF('close');
  }

  this.handles[fd].close();
};

VirtualFS.prototype.createReadStream = function (filename, options) {
  var self = this;

  var readable = new stream.Readable(options);

  options = options || {};

  readable.fd    = options.hasOwnProperty('fd')    ? options.fd    : null;
  readable.flags = options.hasOwnProperty('flags') ? options.flags : 'r';
  readable.mode  = options.hasOwnProperty('mode')  ? options.mode  : null;

  readable.start = options.hasOwnProperty('start') ? options.start : null;
  readable.end   = options.hasOwnProperty('end')   ? options.end   : null;

  readable.autoClose = options.hasOwnProperty('autoClose') ? options.autoClose : true;
  readable.encoding  = options.hasOwnProperty('encoding')  ? options.encoding  : null;

  readable.pos = null;

  if (readable.start !== null) {
    if (typeof readable.start !== 'number') {
      throw new TypeError('start must be a Number');
    }

    if (readable.end === null) {
      readable.end = Infinity;
    } else if (typeof readable.end !== 'number') {
      throw new TypeError('end must be a Number');
    }

    if (readable.start > readable.end) {
      throw new Error('start must be <= end');
    }

    readable.pos = readable.start;
  }

  function end(rd, error) {
    if (rd.autoClose === true && typeof rd.fd === 'number') {
      try {
        self.closeSync(rd.fd);
      } catch (error) {
        return rd.emit('error', error);
      }
    }

    return error ? readable.emit('error', error) : readable.push(null);
  }

  readable._read = function (size) {
    setImmediate(function () {
      if (typeof readable.fd !== 'number') {
        try {
          readable.fd = self.openSync(filename, readable.flags, readable.mode);

          readable.emit('open', readable.fd);
        } catch (error) {
          readable.destroyed = true;

          /* istanbul ignore else */
          if (error.code === 'ENOENT' || error.code === 'EISDIR') {
            error.message = error.code + ', open \'' + filename + '\'';
            delete error.syscall;
          }

          return end(readable, error);
        }
      }

      var toRead = size;

      if (readable.pos !== null) {
        toRead = Math.min(readable.end - readable.pos + 1, toRead);
      }

      if (toRead <= 0) {
        return end(readable);
      }

      var buffer = new Buffer(toRead);

      try {
        var bytesRead = self.readSync(readable.fd, buffer, 0, toRead, readable.pos);

        if (readable.pos !== null) {
          readable.pos += bytesRead;
        }

        if (bytesRead === 0) {
          return end(readable);
        }

        readable.push(buffer.slice(0, bytesRead).toString(readable.encoding), readable.encoding);
      } catch (error) {
        readable.destroyed = true;

        return end(readable, error);
      }
    });
  };

  return readable;
};

VirtualFS.prototype.createWriteStream = function (filename, options) {
  var self = this;

  var writable = new stream.Writable(options);

  options = options || {};

  writable.fd    = options.hasOwnProperty('fd')    ? options.fd    : null;
  writable.flags = options.hasOwnProperty('flags') ? options.flags : 'w';
  writable.mode  = options.hasOwnProperty('mode')  ? options.mode  : null;
  writable.start = options.hasOwnProperty('start') ? options.start : null;

  writable.pos          = null;
  writable.bytesWritten = 0;

  if (writable.start !== null) {
    if (typeof writable.start !== 'number') {
      throw new TypeError('start must be a Number');
    }

    if (writable.start < 0) {
      throw new Error('start must be >= zero');
    }

    writable.pos = writable.start;
  }

  if (typeof writable.fd !== 'number') {
    try {
      writable.fd = self.openSync(filename, writable.flags, writable.mode);
    } catch (error) {
      setImmediate(function () {
        /* istanbul ignore else */
        if (typeof error.code === 'string') {
          error.message = error.code + ', open \'' + filename + '\'';
          delete error.syscall;
        }

        writable.emit('error', error);
      });
    }
  }

  writable._write = function (data, encoding, callback) {
    setImmediate(function () {
      /* istanbul ignore if */
      if (!Buffer.isBuffer(data)) {
        return writable.emit('error', new Error('Invalid data'));
      }

      try {
        var written = self.writeSync(writable.fd, data, 0, data.length, writable.pos);

        writable.bytesWritten += written;

        if (writable.pos !== null) {
          writable.pos += data.length;
        }

        return callback();
      } catch (error) {
        /* istanbul ignore next */
        return callback(error);
      }
    });
  };

  return writable;
};

VirtualFS.prototype.existsSync = function (filepath) {
  return get(this.files, getPathElements(filepath), null) !== null;
};

VirtualFS.prototype.fchmodSync = function (fd, mode) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad argument');
  }

  if (typeof mode !== 'string' && typeof mode !== 'number') {
    throw new TypeError('Bad argument');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed()) {
    throw errors.EBADF('fchmod');
  }

  this.chmodSync(this.handles[fd].path, mode);
};

VirtualFS.prototype.ftruncateSync = function (fd, length) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad argument');
  }

  if (typeof length !== 'undefined' && length !== parseInt(length, 10)) {
    throw new TypeError('Not an integer');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed() || !this.handles[fd].isWritable()) {
    throw errors.EBADF('ftruncate');
  }

  var elements = getPathElements(this.handles[fd].path);
  var file     = get(this.files, elements);

  file['@content'] = (typeof length !== 'undefined') ? file['@content'].slice(0, length) : new Buffer(0);
};

VirtualFS.prototype.mkdirSync = function (filepath, mode) {
  if (typeof filepath !== 'string') {
    throw new TypeError('Bad argument');
  }

  if (this.existsSync(filepath)) {
    throw errors.EEXIST('mkdir', filepath);
  }

  var elements = getPathElements(filepath);

  if (elements.length > 1) {
    var parent = get(this.files, elements.slice(0, -1), null);

    if (parent === null) {
      throw errors.ENOENT('mkdir', filepath);
    }

    if (parent['@type'] !== types.DIR) {
      throw errors.ENOTDIR('mkdir', filepath);
    }
  }

  var directory = Object.defineProperties({}, {
    '@type': {
      value:        types.DIR,
      configurable: false,
      enumerable:   false,
      writable:     false
    },
    '@mode': {
      value:        parseMode(mode, '0777'),
      configurable: false,
      enumerable:   false,
      writable:     false
    }
  });

  set(this.files, elements, directory);
};

VirtualFS.prototype.openSync = function (filepath, flagsString, mode) {
  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  var elements = getPathElements(filepath);
  var exists   = this.existsSync(filepath);
  var fgs      = flags.parse(flagsString);

  if (fgs !== parseInt(fgs, 10)) {
    throw new TypeError('flags must be an int');
  }

  if (!(fgs & flags.CREAT) && !exists) {
    throw errors.ENOENT('open', filepath);
  }

  if ((fgs & flags.EXCL) && exists) {
    throw errors.EEXIST('open', filepath);
  }

  if (exists && get(this.files, elements)['@type'] === types.DIR) {
    throw errors.EISDIR('open', filepath);
  }

  if (elements.length > 1) {
    var parent = get(this.files, elements.slice(0, -1), null);

    if (parent === null) {
      throw errors.ENOENT('open', filepath);
    }

    if (parent['@type'] !== types.DIR) {
      throw errors.ENOTDIR('open', filepath);
    }
  }

  if (((fgs & flags.CREAT) && !exists) || ((fgs & flags.TRUNC) && get(this.files, elements)['@type'] === types.FILE)) {
    var file = Object.defineProperties({}, {
      '@content': {
        value:        new Buffer(0),
        configurable: false,
        enumerable:   false,
        writable:     true
      },
      '@type': {
        value:        types.FILE,
        configurable: false,
        enumerable:   false,
        writable:     false
      },
      '@mode': {
        value:        parseMode(mode, '0666'),
        configurable: false,
        enumerable:   false,
        writable:     true
      }
    });

    set(this.files, elements, file);
  }

  var fd = this.next++;

  var descriptor = new Descriptor(filepath, fgs);

  if (fgs & flags.APPEND) {
    descriptor.write = get(this.files, elements).length;
  }

  this.handles[fd] = descriptor;

  return fd;
};

VirtualFS.prototype.readSync = function (fd, buffer, offset, length, position) {
  var bytesRead = 0;

  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad arguments');
  }

  if (offset > buffer.length) {
    throw new Error('Offset is out of bounds');
  }

  if ((offset + length) > buffer.length) {
    throw new Error('Length extends beyond buffer');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed() || !(this.handles[fd].isReadable())) {
    throw errors.EBADF('read');
  }

  var file    = get(this.files, getPathElements(this.handles[fd].path));
  var content = file['@content'];

  if (file['@type'] === types.DIR) {
    throw errors.EISDIR('read');
  }

  var pos = (position !== null) ? position : this.handles[fd].read;

  bytesRead = Math.min(length, Math.max(content.length - pos, 0));

  if (bytesRead > 0) {
    content.copy(buffer, offset, pos, pos + bytesRead);
  }

  if (position === null) {
    this.handles[fd].read += bytesRead;
  }

  return bytesRead;
};

VirtualFS.prototype.readdirSync = function (filepath) {
  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (!this.existsSync(filepath)) {
    throw errors.ENOENT('readdir', filepath);
  }

  var elements = getPathElements(filepath);
  var content  = get(this.files, elements);

  if (content['@type'] !== types.DIR) {
    throw errors.ENOTDIR('readdir', filepath);
  }

  return Object.keys(content);
};

VirtualFS.prototype.readFileSync = function (filename, options) {
  if (!options) {
    options = {encoding: null, flag: 'r'};
  } else if (typeof options === 'string') {
    options = {encoding: options, flag: 'r'};
  } else if (typeof options !== 'object') {
    throw new TypeError('Bad arguments');
  }

  if (options.encoding && !Buffer.isEncoding(options.encoding)) {
    throw new Error('Unknown encoding: ' + options.encoding);
  }

  this.openSync(filename, options.flag || 'r');

  var file    = get(this.files, getPathElements(filename));
  var content = file['@content'];

  var buffer = new Buffer(content.length);

  content.copy(buffer);

  return options.encoding ? buffer.toString(options.encoding) : buffer;
};

VirtualFS.prototype.renameSync = function (oldPath, newPath) {
  if (newPath.indexOf(oldPath) !== -1) {
    throw errors.EINVAL('rename', oldPath);
  }

  if (!this.existsSync(oldPath)) {
    throw errors.ENOENT('rename', oldPath);
  }

  var oldPathElements = getPathElements(oldPath);
  var newPathElements = getPathElements(newPath);

  newPathElements.slice(0, -1).reduce(function (memo, element) {
    memo.push(element);

    var parent = get(this.files, memo, null);

    if (parent === null) {
      throw errors.ENOENT('rename', oldPath);
    }

    if (parent['@type'] !== types.DIR) {
      throw errors.ENOTDIR('rename', oldPath);
    }

    return memo;
  }.bind(this), []);

  set(this.files, newPathElements, get(this.files, oldPathElements));

  unset(this.files, oldPathElements);
};

VirtualFS.prototype.rmdirSync = function (filepath) {
  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (!this.existsSync(filepath)) {
    throw errors.ENOENT('rmdir', filepath);
  }

  var elements = getPathElements(filepath);
  var content  = get(this.files, elements);

  if (content['@type'] !== types.DIR) {
    throw errors.ENOTDIR('rmdir', filepath);
  }

  unset(this.files, elements);
};

VirtualFS.prototype.truncateSync = function (filepath, length) {
  var fd = null;

  try {
    fd = this.openSync(filepath, 'r+');
    this.ftruncateSync(fd, length);
  } finally {
    if (fd !== null) {
      this.closeSync(fd);
    }
  }
};

VirtualFS.prototype.unlinkSync = function (filepath) {
  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (!this.existsSync(filepath)) {
    throw errors.ENOENT('unlink', filepath);
  }

  var elements = getPathElements(filepath);
  var content  = get(this.files, elements);

  if (content['@type'] === types.DIR) {
    throw errors.EISDIR('unlink', filepath);
  }

  unset(this.files, elements);
};

VirtualFS.prototype.writeSync = function (fd, buffer, offset, length, position) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad arguments');
  }

  if (offset > buffer.length) {
    throw new Error('Offset is out of bounds');
  }

  if ((offset + length) > buffer.length) {
    throw new Error('off + len > buffer.length');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed() || !this.handles[fd].isWritable()) {
    throw errors.EBADF('write');
  }

  var file    = get(this.files, getPathElements(this.handles[fd].path));
  var content = file['@content'];

  var pos = 0;

  if (this.handles[fd].flags & flags.APPEND) {
    pos = content.length;
  } else if (position !== null) {
    pos = position;
  } else {
    pos = this.handles[fd].write;
  }

  if (content.length < pos + length) {
    var tmp = new Buffer(pos + length);

    tmp.fill(' ', content.length, pos + length);

    content.copy(tmp, 0, 0, content.length);

    content = tmp;

    file['@content'] = content;
  }

  buffer.copy(content, pos, offset, offset + length);

  if (position === null) {
    this.handles[fd].write += length;
  }

  return length;
};

VirtualFS.prototype.writeFileSync = function (filename, data, options) {
  if (typeof filename !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (!options) {
    options = {encoding: null, mode: '0666', flag: 'a'};
  } else if (typeof options === 'string') {
    options = {encoding: options, mode: '0666', flag: 'a'};
  } else if (typeof options !== 'object') {
    throw new TypeError('Bad arguments');
  }

  var content = Buffer.isBuffer(data) ? data : new Buffer(data.toString(), options.encoding || 'utf8');
  var fd      = this.openSync(filename, options.flag || 'w', options.mode);

  this.writeSync(fd, content, 0, content.length, null);
  this.closeSync(fd);
};

module.exports = VirtualFS;
