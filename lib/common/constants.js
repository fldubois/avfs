'use strict';

module.exports = {
  // File flags

  S_IFREG: 32768,
  S_IFDIR: 16384,
  S_IFLNK: 40960,

  // Open modes

  O_RDONLY: 1,
  O_WRONLY: 2,
  O_RDWR:   4,
  O_CREAT:  8,
  O_EXCL:   16,
  O_TRUNC:  32,
  O_APPEND: 64,

  // Error codes

  EBADF:   9,
  EINVAL:  18,
  ENOTDIR: 27,
  EISDIR:  28,
  ENOENT:  34,
  EEXIST:  47,
  EPERM:   50
};
