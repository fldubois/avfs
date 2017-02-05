'use strict';

var path   = require('path');
var stream = require('stream');

var get   = require('lodash.get');
var set   = require('lodash.set');
var unset = require('lodash.unset');

var flags = require('./common/flags');
var types = require('./common/types');

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
  var error = null;

  if (typeof filename !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (!options) {
    options = {encoding: null};
  } else if (typeof options === 'string') {
    options = {encoding: options};
  } else if (typeof options !== 'object') {
    throw new TypeError('Bad arguments');
  }

  var elements = getPathElements(filename);

  if (elements.length > 1) {
    var parent = get(this.files, elements.slice(0, -1), null);

    if (parent === null) {
      error = new Error('ENOENT, no such file or directory \'' + filename + '\'');

      error.errno   = 34;
      error.code    = 'ENOENT';
      error.path    = filename;
      error.syscall = 'open';

      throw error;
    }

    if (parent['@type'] !== types.DIR) {
      error = new Error('ENOTDIR, not a directory \'' + filename + '\'');

      error.errno   = 27;
      error.code    = 'ENOTDIR';
      error.path    = filename;
      error.syscall = 'open';

      throw error;
    }
  }

  var content = get(this.files, elements, null);

  if (content !== null && content['@type'] === types.DIR) {
    error = new Error('EISDIR, illegal operation on a directory \'' + filename + '\'');

    error.errno   = 28;
    error.code    = 'EISDIR';
    error.path    = filename;
    error.syscall = 'open';

    throw error;
  }

  if (options.encoding && !Buffer.isEncoding(options.encoding)) {
    throw new Error('Unknown encoding: ' + options.encoding);
  }

  data = Buffer.isBuffer(data) ? data : new Buffer(data.toString(), options.encoding || 'utf8');

  set(this.files, elements, content !== null ? Buffer.concat([content, data]) : data);
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
    var error = new Error('ENOENT, no such file or directory \'' + filepath + '\'');

    error.errno   = 34;
    error.code    = 'ENOENT';
    error.path    = filepath;
    error.syscall = 'chmod';

    throw error;
  }

  var file = get(this.files, getPathElements(filepath));

  file['@mode'] = parseMode(mode);
};

VirtualFS.prototype.closeSync = function (fd) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad argument');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed()) {
    var error = new Error('EBADF, bad file descriptor');

    error.errno   = 9;
    error.code    = 'EBADF';
    error.syscall = 'close';

    throw error;
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

          var file = get(self.files, getPathElements(filename), null);

          if (file !== null && file['@type'] === types.DIR) {
            var error = new Error('EISDIR, read');

            error.errno = 28;
            error.code  = 'EISDIR';

            throw error;
          }
        } catch (error) {
          readable.destroyed = true;

          if (error.code === 'ENOENT') {
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

      var file = get(self.files, getPathElements(filename), null);

      if (file !== null && file['@type'] === types.DIR) {
        var error = new Error('EISDIR, open \'' + filename + '\'');

        error.errno = 28;
        error.code  = 'EISDIR';
        error.path  = filename;

        writable.emit('error', error);
      }
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

VirtualFS.prototype.ftruncateSync = function (fd, length) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad argument');
  }

  if (typeof length !== 'undefined' && length !== parseInt(length, 10)) {
    throw new TypeError('Not an integer');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd].isClosed() || !this.handles[fd].isWritable()) {
    var error = new Error('EBADF, bad file descriptor');

    error.errno   = 9;
    error.code    = 'EBADF';
    error.syscall = 'ftruncate';

    throw error;
  }

  this.truncateSync(this.handles[fd].path, length);
};

VirtualFS.prototype.mkdirSync = function (filepath, mode) {
  var error  = null;

  if (typeof filepath !== 'string') {
    throw new TypeError('Bad argument');
  }

  if (this.existsSync(filepath)) {
    error = new Error('EEXIST, file already exists \'' + filepath + '\'');

    error.errno   = 47;
    error.code    = 'EEXIST';
    error.path    = filepath;
    error.syscall = 'mkdir';

    throw error;
  }

  var elements = getPathElements(filepath);

  if (elements.length > 1) {
    var parent = get(this.files, elements.slice(0, -1), null);

    if (parent === null) {
      error = new Error('ENOENT, no such file or directory \'' + filepath + '\'');

      error.errno   = 34;
      error.code    = 'ENOENT';
      error.path    = filepath;
      error.syscall = 'mkdir';

      throw error;
    }

    if (parent['@type'] !== types.DIR) {
      error = new Error('ENOTDIR, not a directory \'' + filepath + '\'');

      error.errno   = 27;
      error.code    = 'ENOTDIR';
      error.path    = filepath;
      error.syscall = 'mkdir';

      throw error;
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
  var elements = getPathElements(filepath);
  var error    = null;
  var exists   = this.existsSync(filepath);
  var fgs      = flags.parse(flagsString);

  if (!(fgs & flags.CREAT) && !exists) {
    error = new Error('ENOENT, no such file or directory \'' + filepath + '\'');

    error.errno   = 34;
    error.code    = 'ENOENT';
    error.path    = filepath;
    error.syscall = 'open';

    throw error;
  }

  if ((fgs & flags.EXCL) && exists) {
    error = new Error('EEXIST, file already exists \'' + filepath + '\'');

    error.errno   = 47;
    error.code    = 'EEXIST';
    error.path    = filepath;
    error.syscall = 'open';

    throw error;
  }

  if (((fgs & flags.CREAT) && !exists) || ((fgs & flags.TRUNC) && get(this.files, elements)['@type'] === types.FILE)) {
    var file = new Buffer(0);

    Object.defineProperties(file, {
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
  var error     = null;

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
    error = new Error('EBADF, read');

    error.errno   = 9;
    error.code    = 'EBADF';

    throw error;
  }

  var content = get(this.files, getPathElements(this.handles[fd].path));

  if (content['@type'] === types.DIR) {
    error = new Error('EISDIR, read');

    error.errno   = 28;
    error.code    = 'EISDIR';

    throw error;
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
  var error  = null;

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (!this.existsSync(filepath)) {
    error = new Error('ENOENT, no such file or directory \'' + filepath + '\'');

    error.errno   = 34;
    error.code    = 'ENOENT';
    error.path    = filepath;
    error.syscall = 'readdir';

    throw error;
  }

  var elements = getPathElements(filepath);
  var content  = get(this.files, elements);

  if (content['@type'] !== types.DIR) {
    error = new Error('ENOTDIR, not a directory \'' + filepath + '\'');

    error.errno   = 27;
    error.code    = 'ENOTDIR';
    error.path    = filepath;
    error.syscall = 'readdir';

    throw error;
  }

  return Object.keys(content);
};

VirtualFS.prototype.readFileSync = function (filename, options) {
  var error = null;

  if (typeof filename !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (!options) {
    options = {encoding: null};
  } else if (typeof options === 'string') {
    options = {encoding: options};
  } else if (typeof options !== 'object') {
    throw new TypeError('Bad arguments');
  }

  if (!this.existsSync(filename)) {
    error = new Error('ENOENT, no such file or directory \'' + filename + '\'');

    error.errno   = 34;
    error.code    = 'ENOENT';
    error.path    = filename;
    error.syscall = 'open';

    throw error;
  }

  var content  = get(this.files, getPathElements(filename));

  if (content['@type'] === types.DIR) {
    error = new Error('EISDIR, illegal operation on a directory');

    error.errno   = 28;
    error.code    = 'EISDIR';
    error.syscall = 'read';

    throw error;
  }

  if (options.encoding && !Buffer.isEncoding(options.encoding)) {
    throw new Error('Unknown encoding: ' + options.encoding);
  }

  return options.encoding ? content.toString(options.encoding) : content;
};

VirtualFS.prototype.renameSync = function (oldPath, newPath) {
  if (!this.existsSync(oldPath)) {
    var error = new Error('ENOENT, no such file or directory \'' + oldPath + '\'');

    error.errno   = 34;
    error.code    = 'ENOENT';
    error.path    = oldPath;
    error.syscall = 'rename';

    throw error;
  }

  var oldPathElements = getPathElements(oldPath);
  var newPathElements = getPathElements(newPath);

  set(this.files, newPathElements, get(this.files, oldPathElements));

  unset(this.files, oldPathElements);
};

VirtualFS.prototype.rmdirSync = function (filepath) {
  var error  = null;

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (!this.existsSync(filepath)) {
    error = new Error('ENOENT, no such file or directory \'' + filepath + '\'');

    error.errno   = 34;
    error.code    = 'ENOENT';
    error.path    = filepath;
    error.syscall = 'rmdir';

    throw error;
  }

  var elements = getPathElements(filepath);
  var content  = get(this.files, elements);

  if (content['@type'] !== types.DIR) {
    error = new Error('ENOTDIR, not a directory \'' + filepath + '\'');

    error.errno   = 27;
    error.code    = 'ENOTDIR';
    error.path    = filepath;
    error.syscall = 'rmdir';

    throw error;
  }

  unset(this.files, elements);
};

VirtualFS.prototype.truncateSync = function (filepath, length) {
  var error  = null;

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (typeof length !== 'undefined' && length !== parseInt(length, 10)) {
    throw new TypeError('Not an integer');
  }

  if (!this.existsSync(filepath)) {
    error = new Error('ENOENT, no such file or directory \'' + filepath + '\'');

    error.errno   = 34;
    error.code    = 'ENOENT';
    error.path    = filepath;
    error.syscall = 'open';

    throw error;
  }

  var elements = getPathElements(filepath);
  var content  = get(this.files, elements);

  if (content['@type'] === types.DIR) {
    error = new Error('EISDIR, illegal operation on a directory \'' + filepath + '\'');

    error.errno   = 28;
    error.code    = 'EISDIR';
    error.path    = filepath;
    error.syscall = 'open';

    throw error;
  }

  set(this.files, elements, typeof length !== 'undefined' ? content.slice(0, length) : new Buffer(0));
};

VirtualFS.prototype.unlinkSync = function (filepath) {
  var error  = null;

  if (typeof filepath !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (!this.existsSync(filepath)) {
    error = new Error('ENOENT, no such file or directory \'' + filepath + '\'');

    error.errno   = 34;
    error.code    = 'ENOENT';
    error.path    = filepath;
    error.syscall = 'unlink';

    throw error;
  }

  var elements = getPathElements(filepath);
  var content  = get(this.files, elements);

  if (content['@type'] === types.DIR) {
    error = new Error('EISDIR, illegal operation on a directory \'' + filepath + '\'');

    error.errno   = 28;
    error.code    = 'EISDIR';
    error.path    = filepath;
    error.syscall = 'unlink';

    throw error;
  }

  unset(this.files, elements);
};

VirtualFS.prototype.writeSync = function (fd, buffer, offset, length, position) {
  var error = null;

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
    error = new Error('EBADF, write');

    error.errno   = 9;
    error.code    = 'EBADF';

    throw error;
  }

  var content = get(this.files, getPathElements(this.handles[fd].path), new Buffer(0));

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

    Object.defineProperties(tmp, {
      '@type': {
        value:        content['@type'],
        configurable: false,
        enumerable:   false,
        writable:     false
      },
      '@mode': {
        value:        content['@mode'],
        configurable: false,
        enumerable:   false,
        writable:     true
      }
    });

    content = tmp;
  }

  buffer.copy(content, pos, offset, offset + length);

  if (position === null) {
    this.handles[fd].write += length;
  }

  set(this.files, getPathElements(this.handles[fd].path), content);

  return length;
};

VirtualFS.prototype.writeFileSync = function (filename, data, options) {
  var error = null;

  if (typeof filename !== 'string') {
    throw new TypeError('path must be a string');
  }

  if (!options) {
    options = {encoding: null};
  } else if (typeof options === 'string') {
    options = {encoding: options};
  } else if (typeof options !== 'object') {
    throw new TypeError('Bad arguments');
  }

  var elements = getPathElements(filename);

  if (elements.length > 1) {
    var parent = get(this.files, elements.slice(0, -1), null);

    if (parent === null) {
      error = new Error('ENOENT, no such file or directory \'' + filename + '\'');

      error.errno   = 34;
      error.code    = 'ENOENT';
      error.path    = filename;
      error.syscall = 'open';

      throw error;
    }

    if (parent['@type'] !== types.DIR) {
      error = new Error('ENOTDIR, not a directory \'' + filename + '\'');

      error.errno   = 27;
      error.code    = 'ENOTDIR';
      error.path    = filename;
      error.syscall = 'open';

      throw error;
    }
  }

  var content = get(this.files, elements, null);

  if (content !== null && content['@type'] === types.DIR) {
    error = new Error('EISDIR, illegal operation on a directory \'' + filename + '\'');

    error.errno   = 28;
    error.code    = 'EISDIR';
    error.path    = filename;
    error.syscall = 'open';

    throw error;
  }

  if (options.encoding && !Buffer.isEncoding(options.encoding)) {
    throw new Error('Unknown encoding: ' + options.encoding);
  }

  set(this.files, elements, Buffer.isBuffer(data) ? data : new Buffer(data.toString(), options.encoding || 'utf8'));
};

module.exports = VirtualFS;
