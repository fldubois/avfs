'use strict';

var types = require('./types');

function Stats(element) {
  Object.defineProperty(this, 'element', {
    value:        element,
    configurable: false,
    enumerable:   false,
    writable:     false
  });

  this.dev     = 1;
  this.ino     = element.get('inode');
  this.mode    = element.get('mode');
  this.nlink   = element.get('nlink');
  this.uid     = element.get('uid');
  this.gid     = element.get('gid');
  this.rdev    = 0;
  this.size    = 0;
  this.blksize = 512;
  this.blocks  = 0;
  this.atime   = element.get('atime');
  this.mtime   = element.get('mtime');
  this.ctime   = element.get('ctime');
}

Stats.prototype.isDirectory = function () {
  return this.element.get('type') === types.DIR;
};

Stats.prototype.isFile = function () {
  return this.element.get('type') === types.FILE;
};

Stats.prototype.isBlockDevice = function () {
  return false;
};

Stats.prototype.isCharacterDevice = function () {
  return false;
};

Stats.prototype.isSymbolicLink = function () {
  return this.element.get('type') === types.SYMLINK;
};

Stats.prototype.isFIFO = function () {
  return false;
};

Stats.prototype.isSocket = function () {
  return false;
};

module.exports = Stats;
