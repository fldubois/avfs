'use strict';

var path = require('path');

var elements  = require('./elements');
var parsers   = require('./parsers');

var AVFSError = require('./avfs-error');

function Storage(constants) {
  var root = elements.directory('755', {});

  root.set('uid', 0);
  root.set('gid', 0);

  this.constants = constants;
  this.files     = root;
}

Storage.prototype.get = function (filepath, follow, slice) {
  if (typeof follow === 'number') {
    slice  = follow;
    follow = true;
  } else if (typeof follow === 'undefined') {
    follow = true;
  }

  var current = this.files;
  var parts   = parsers.path(filepath);

  if (typeof slice === 'number') {
    parts = parts.slice(0, slice * -1);
  }

  for (var i = 0; i < parts.length; i++) {
    if (current.get('type') !== this.constants.S_IFDIR) {
      throw new AVFSError('ENOTDIR', filepath);
    }

    if (!current.isExecutable()) {
      throw new AVFSError('EACCES', filepath);
    }

    var key = parts[i];

    var children = current.get('content');

    if (!children.hasOwnProperty(key)) {
      throw new AVFSError('ENOENT', filepath);
    }

    current = children[key];

    if (follow && current.get('type') === this.constants.S_IFLNK) {
      var target = current.get('target');

      return this.get((target[0] === '/') ? target : path.resolve(path.dirname(filepath), target));
    }
  }

  return current;
};

Storage.prototype.set = function (filepath, file) {
  var parent = this.get(filepath, 1);

  if (parent.get('type') !== this.constants.S_IFDIR) {
    throw new AVFSError('ENOTDIR', filepath);
  }

  if (!parent.isWritable()) {
    throw new AVFSError('EACCES', filepath);
  }

  parent.get('content')[path.basename(filepath)] = file;
};

Storage.prototype.unset = function (filepath) {
  var parent   = this.get(filepath, 1);
  var filename = path.basename(filepath);

  if (parent.get('type') !== this.constants.S_IFDIR) {
    throw new AVFSError('ENOTDIR', filepath);
  }

  if (!parent.isWritable()) {
    throw new AVFSError('EACCES', filepath);
  }

  delete parent.get('content')[filename];
};

module.exports = Storage;
