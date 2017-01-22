'use strict';

var path   = require('path');
var stream = require('stream');

var get   = require('lodash.get');
var set   = require('lodash.set');
var unset = require('lodash.unset');

var F_RO     = 1;
var F_WO     = 2;
var F_RW     = 4;
var F_CREAT  = 8;
var F_TRUNC  = 16;
var F_EXCL   = 32;
var F_APPEND = 64;

var getPathElements = function (filepath) {
  return path.normalize(filepath).replace(/\/|\\/g, path.sep).replace(new RegExp('^' + path.sep), '').split(path.sep);
};

var parseFlags = function (flags) {
  switch (flags) {
    case 'r':   // fall through
    case 'rs':  return F_RO;

    case 'r+':  // fall through
    case 'rs+': return F_RW;

    case 'w':  return F_WO | F_CREAT | F_TRUNC;
    case 'wx': // fall through
    case 'xw': return F_WO | F_CREAT | F_TRUNC | F_EXCL;

    case 'w+':  return F_RW | F_CREAT | F_TRUNC;
    case 'wx+': // fall through
    case 'xw+': return F_RW | F_CREAT | F_TRUNC | F_EXCL;

    case 'a':  return F_WO | F_CREAT | F_APPEND;
    case 'ax': // fall through
    case 'xa': return F_WO | F_CREAT | F_APPEND | F_EXCL;

    case 'a+':  return F_RW | F_CREAT | F_APPEND;
    case 'ax+': // fall through
    case 'xa+': return F_RW | F_CREAT | F_APPEND | F_EXCL;

    default: throw new Error('Unknown file open flag: ' + flags);
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
    var directory = get(this.files, elements.slice(0, -1), null);

    if (directory === null) {
      error = new Error('ENOENT, no such file or directory \'' + filename + '\'');

      error.errno   = 34;
      error.code    = 'ENOENT';
      error.path    = filename;
      error.syscall = 'open';

      throw error;
    }

    if (typeof directory !== 'object' || Buffer.isBuffer(directory)) {
      error = new Error('ENOTDIR, not a directory \'' + filename + '\'');

      error.errno   = 27;
      error.code    = 'ENOTDIR';
      error.path    = filename;
      error.syscall = 'open';

      throw error;
    }
  }

  var content = get(this.files, elements, null);

  if (content !== null && !Buffer.isBuffer(content)) {
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

VirtualFS.prototype.closeSync = function (fd) {
  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad argument');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd] === null || !(this.handles[fd].flags & (F_WO | F_RW))) {
    var error = new Error('EBADF, bad file descriptor');

    error.errno   = 9;
    error.code    = 'EBADF';
    error.syscall = 'close';

    throw error;
  }

  this.handles[fd] = null;
};

// TODO: Handle options
VirtualFS.prototype.createReadStream = function (filename) {
  var error     = null;
  var file      = get(this.files, getPathElements(filename), null);
  var readable  = new stream.Readable();

  readable._read = function (size) {
    setImmediate(function () {
      if (file === null) {
        error = new Error('ENOENT, open \'' + filename + '\'');

        error.errno = 34;
        error.code  = 'ENOENT';
        error.path  = filename;

        return readable.emit('error', error);
      }

      if (!Buffer.isBuffer(file)) {
        error = new Error('EISDIR, read');

        error.errno = 28;
        error.code  = 'EISDIR';

        return readable.emit('error', error);
      }

      if (file.length > 0) {
        var buffer = file.slice(0, size);

        file = file.slice(size);

        return this.push(buffer);
      }

      this.push(null);
    }.bind(this));
  };

  return readable;
};

// TODO: Handle mode option
VirtualFS.prototype.createWriteStream = function (filename, options) {
  var self = this;

  var writable = new stream.Writable(options);

  options = options || {};

  writable.fd    = options.hasOwnProperty('fd')    ? options.fd    : null;
  writable.flags = options.hasOwnProperty('flags') ? options.flags : 'w';
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
      writable.fd = self.openSync(filename, writable.flags, null);

      if (!Buffer.isBuffer(get(self.files, getPathElements(filename)))) {
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

      self.write(writable.fd, data, 0, data.length, writable.pos, function (error, written) {
        /* istanbul ignore if */
        if (error) {
          return callback(error);
        }

        writable.writtenWritten += written;

        return callback();
      });

      if (writable.pos !== null) {
        writable.pos += data.length;
      }
    });
  };

  return writable;
};

VirtualFS.prototype.existsSync = function (filepath) {
  return get(this.files, getPathElements(filepath), null) !== null;
};

// TODO: Handle mode parameter
VirtualFS.prototype.openSync = function (filepath, flags, mode) {
  var elements = getPathElements(filepath);
  var error    = null;
  var exists   = this.existsSync(filepath);
  var fgs      = parseFlags(flags);

  if (!(fgs & F_CREAT) && !exists) {
    error = new Error('ENOENT, no such file or directory \'' + filepath + '\'');

    error.errno   = 34;
    error.code    = 'ENOENT';
    error.path    = filepath;
    error.syscall = 'open';

    throw error;
  }

  if ((fgs & F_EXCL) && exists) {
    error = new Error('EEXIST, file already exists \'' + filepath + '\'');

    error.errno   = 47;
    error.code    = 'EEXIST';
    error.path    = filepath;
    error.syscall = 'open';

    throw error;
  }

  if (((fgs & F_CREAT) && !exists) || ((fgs & F_TRUNC) && Buffer.isBuffer(get(this.files, elements)))) {
    set(this.files, elements, new Buffer(0));
  }

  var fd = this.next++;

  this.handles[fd] = {
    flags: fgs,
    path:  filepath,
    read:  0,
    write: (fgs & F_APPEND) ? get(this.files, elements).length : 0
  };

  return fd;
};

VirtualFS.prototype.read = function (fd, buffer, offset, length, position, callback) {
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

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd] === null || !(this.handles[fd].flags & (F_RW | F_RO))) {
    error = new Error('EBADF, read');

    error.errno   = 9;
    error.code    = 'EBADF';

    setImmediate(function () {
      callback(error, bytesRead, buffer);
    });

    return void 0;
  }

  var content = get(this.files, getPathElements(this.handles[fd].path));

  if (!Buffer.isBuffer(content)) {
    error = new Error('EISDIR, read');

    error.errno   = 28;
    error.code    = 'EISDIR';

    setImmediate(function () {
      callback(error, bytesRead, buffer);
    });

    return void 0;
  }

  var pos = (position !== null) ? position : this.handles[fd].read;

  bytesRead = Math.min(length, Math.max(content.length - pos, 0));

  if (bytesRead > 0) {
    content.copy(buffer, offset, pos, pos + bytesRead);
  }

  if (position === null) {
    this.handles[fd].read += bytesRead;
  }

  setImmediate(function () {
    callback(null, bytesRead, buffer);
  });
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

  if (Buffer.isBuffer(content)) {
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

  if (!Buffer.isBuffer(content)) {
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

  if (Buffer.isBuffer(content)) {
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

  if (!Buffer.isBuffer(content)) {
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

  if (!Buffer.isBuffer(content)) {
    error = new Error('EISDIR, illegal operation on a directory \'' + filepath + '\'');

    error.errno   = 28;
    error.code    = 'EISDIR';
    error.path    = filepath;
    error.syscall = 'unlink';

    throw error;
  }

  unset(this.files, elements);
};

// TODO: ignore position in append mode
VirtualFS.prototype.write = function (fd, buffer, offset, length, position, callback) {
  var bytesRead = 0;
  var error     = null;

  if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
    throw new TypeError('Bad arguments');
  }

  if (offset > buffer.length) {
    throw new Error('Offset is out of bounds');
  }

  if ((offset + length) > buffer.length) {
    throw new Error('off + len > buffer.length');
  }

  if (!this.handles.hasOwnProperty(fd) || this.handles[fd] === null || !(this.handles[fd].flags & (F_RW | F_WO))) {
    error = new Error('EBADF, write');

    error.errno   = 9;
    error.code    = 'EBADF';

    setImmediate(function () {
      callback(error, bytesRead, buffer);
    });

    return void 0;
  }

  var content = get(this.files, getPathElements(this.handles[fd].path), new Buffer(0));

  var pos = (position !== null) ? position : this.handles[fd].write;

  if (content.length < pos + length) {
    var tmp = new Buffer(pos + length);

    content.copy(tmp, 0, 0, content.length);

    content = tmp;
  }

  buffer.copy(content, pos, offset, offset + length);

  if (position === null) {
    this.handles[fd].write += length;
  }

  set(this.files, getPathElements(this.handles[fd].path), content);

  setImmediate(function () {
    callback(null, length, buffer);
  });
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
    var directory = get(this.files, elements.slice(0, -1), null);

    if (directory === null) {
      error = new Error('ENOENT, no such file or directory \'' + filename + '\'');

      error.errno   = 34;
      error.code    = 'ENOENT';
      error.path    = filename;
      error.syscall = 'open';

      throw error;
    }

    if (typeof directory !== 'object' || Buffer.isBuffer(directory)) {
      error = new Error('ENOTDIR, not a directory \'' + filename + '\'');

      error.errno   = 27;
      error.code    = 'ENOTDIR';
      error.path    = filename;
      error.syscall = 'open';

      throw error;
    }
  }

  var content = get(this.files, elements, null);

  if (content !== null && !Buffer.isBuffer(content)) {
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
