'use strict';

module.exports = function (constants, options) {
  function Stats(element) {
    Object.defineProperty(this, 'element', {
      value:        element,
      configurable: false,
      enumerable:   false,
      writable:     false
    });

    this.dev     = 1;
    this.ino     = element.get('inode');
    this.mode    = element.get('mode') + element.get('type');
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

    if (typeof options === 'object') {
      if (options.birthtime === true) {
        this.birthtime = element.get('birthtime');
      }

      if (options.milliseconds === true) {
        this.atimeMs = this.atime.getTime();
        this.mtimeMs = this.mtime.getTime();
        this.ctimeMs = this.ctime.getTime();
      }

      if (options.birthtime === true && options.milliseconds === true) {
        this.birthtimeMs = this.birthtime.getTime();
      }
    }
  }

  Stats.prototype.isDirectory = function () {
    return this.element.get('type') === constants.S_IFDIR;
  };

  Stats.prototype.isFile = function () {
    return this.element.get('type') === constants.S_IFREG;
  };

  Stats.prototype.isBlockDevice = function () {
    return false;
  };

  Stats.prototype.isCharacterDevice = function () {
    return false;
  };

  Stats.prototype.isSymbolicLink = function () {
    return this.element.get('type') === constants.S_IFLNK;
  };

  Stats.prototype.isFIFO = function () {
    return false;
  };

  Stats.prototype.isSocket = function () {
    return false;
  };

  return Stats;
};
