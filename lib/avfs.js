'use strict';

var path = require('path');

var get = require('lodash.get');
var set = require('lodash.set');

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

VirtualFS.prototype.existsSync = function (filepath) {
  return get(this.files, getPathElements(filepath), null) !== null;
};

VirtualFS.prototype.openSync = function (filepath, flags, mode) {
  var error  = null;
  var exists = this.existsSync(filepath);
  var fgs    = parseFlags(flags);

  if (!(fgs & F_CREAT) && !exists) {
    error = new Error('Error: ENOENT, no such file or directory \'' + filepath + '\'');

    error.errno   = 34;
    error.code    = 'ENOENT';
    error.path    = filepath;
    error.syscall = 'open';

    throw error;
  }

  if ((fgs & F_EXCL) && exists) {
    error = new Error('Error: EEXIST, file already exists \'' + filepath + '\'');

    error.errno   = 47;
    error.code    = 'EEXIST';
    error.path    = filepath;
    error.syscall = 'open';

    throw error;
  }

  if (((fgs & F_CREAT) && !exists) || (fgs & F_TRUNC)) {
    set(this.files, getPathElements(filepath), new Buffer(0));
  }

  var fd = this.next++;

  this.handles[fd] = {
    flags: fgs,
    path:  filepath
  };

  return fd;
};

module.exports = VirtualFS;
