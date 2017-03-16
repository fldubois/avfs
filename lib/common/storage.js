'use strict';

var path = require('path');

var errors = require('./errors');
var types  = require('./types');

function getErrorData(syscall, filepath) {
  var data = (typeof syscall === 'object') ? syscall : {syscall: syscall};

  if (!data.hasOwnProperty('filepath')) {
    data.filepath = filepath;
  }

  return data;
}

var parse = module.exports.parse = function parse(filepath) {
  var normalized = path.normalize(filepath).replace(/\/|\\/g, path.sep).replace(new RegExp('^' + path.sep), '');

  return (normalized.length > 0) ? normalized.split(path.sep) : [];
};

var get = module.exports.get = function get(files, syscall, filepath, follow, slice) {
  if (typeof follow === 'number') {
    slice  = follow;
    follow = true;
  } else if (typeof follow === 'undefined') {
    follow = true;
  }

  var current  = files;
  var data     = getErrorData(syscall, filepath);
  var elements = parse(filepath);

  if (typeof slice === 'number') {
    elements = elements.slice(0, slice * -1);
  }

  for (var i = 0; i < elements.length; i++) {
    if (current.get('type') !== types.DIR) {
      throw errors.ENOTDIR(data.syscall, data.filepath);
    }

    var key = elements[i];

    var children = current.get('content');

    if (!children.hasOwnProperty(key)) {
      throw errors.ENOENT(data.syscall, data.filepath);
    }

    current = children[key];

    if (follow && current.get('type') === types.SYMLINK) {
      var target = current.get('target');

      return get(files, data, (target[0] === '/') ? target : path.resolve(path.dirname(filepath), target));
    }
  }

  return current;
};

module.exports.set = function set(files, syscall, filepath, file) {
  var parent = get(files, syscall, filepath, 1);
  var data   = getErrorData(syscall, filepath);

  if (parent !== files && parent.get('type') !== types.DIR) {
    throw errors.ENOTDIR(data.syscall, data.filepath);
  }

  parent.get('content')[path.basename(filepath)] = file;
};

module.exports.unset = function unset(files, syscall, filepath) {
  var parent   = get(files, syscall, filepath, 1);
  var filename = path.basename(filepath);
  var data     = getErrorData(syscall, filepath);

  if (parent !== files && parent.get('type') !== types.DIR) {
    throw errors.ENOTDIR(data.syscall, data.filepath);
  }

  delete parent.get('content')[filename];
};
