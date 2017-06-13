'use strict';

var path = require('path');

var constants = require('./constants');
var errors    = require('./errors');
var elements  = require('./elements');
var parsers   = require('./parsers');

function getErrorData(syscall, filepath) {
  var data = (typeof syscall === 'object') ? syscall : {syscall: syscall};

  if (!data.hasOwnProperty('path')) {
    data.path = filepath;
  }

  return data;
}

function Storage() {
  var root = elements.directory('755', {});

  root.set('uid', 0);
  root.set('gid', 0);

  this.files = root;
}

Storage.prototype.get = function (syscall, filepath, follow, slice) {
  if (typeof follow === 'number') {
    slice  = follow;
    follow = true;
  } else if (typeof follow === 'undefined') {
    follow = true;
  }

  var current = this.files;
  var data    = getErrorData(syscall, filepath);
  var parts   = parsers.path(filepath);

  if (typeof slice === 'number') {
    parts = parts.slice(0, slice * -1);
  }

  for (var i = 0; i < parts.length; i++) {
    if (current.get('type') !== constants.S_IFDIR) {
      throw errors.ENOTDIR(data);
    }

    if (!current.isExecutable()) {
      throw errors.EACCES(data);
    }

    var key = parts[i];

    var children = current.get('content');

    if (!children.hasOwnProperty(key)) {
      throw errors.ENOENT(data);
    }

    current = children[key];

    if (follow && current.get('type') === constants.S_IFLNK) {
      var target = current.get('target');

      return this.get(data, (target[0] === '/') ? target : path.resolve(path.dirname(filepath), target));
    }
  }

  return current;
};

Storage.prototype.set = function (syscall, filepath, file) {
  var parent = this.get(syscall, filepath, 1);
  var data   = getErrorData(syscall, filepath);

  if (parent.get('type') !== constants.S_IFDIR) {
    throw errors.ENOTDIR(data);
  }

  if (!parent.isWritable()) {
    throw errors.EACCES(data);
  }

  parent.get('content')[path.basename(filepath)] = file;
};

Storage.prototype.unset = function (syscall, filepath) {
  var parent   = this.get(syscall, filepath, 1);
  var filename = path.basename(filepath);
  var data     = getErrorData(syscall, filepath);

  if (parent.get('type') !== constants.S_IFDIR) {
    throw errors.ENOTDIR(data);
  }

  if (!parent.isWritable()) {
    throw errors.EACCES(data);
  }

  delete parent.get('content')[filename];
};

module.exports = Storage;
