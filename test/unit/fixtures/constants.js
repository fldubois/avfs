'use strict';

module.exports = {
  // File flags

  S_IFLNK: 40960, // 0120000 - symbolic link
  S_IFREG: 32768, // 0100000 - regular file
  S_IFDIR: 16384, // 0040000 - directory
  S_IRUSR: 256,   // 0000400 - owner has read permission
  S_IWUSR: 128,   // 0000200 - owner has write permission
  S_IXUSR: 64,    // 0000100 - owner has execute permission
  S_IRGRP: 32,    // 0000040 - group has read permission
  S_IWGRP: 16,    // 0000020 - group has write permission
  S_IXGRP: 8,     // 0000010 - group has execute permission
  S_IROTH: 4,     // 0000004 - others have read permission
  S_IWOTH: 2,     // 0000002 - others have write permission
  S_IXOTH: 1,      // 0000001 - others have execute permission

  // Open modes

  O_RDONLY: 1,
  O_WRONLY: 2,
  O_RDWR:   4,
  O_CREAT:  8,
  O_EXCL:   16,
  O_TRUNC:  32,
  O_APPEND: 64,

  // Access modes

  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1,

  // Copy modes

  COPYFILE_EXCL: 1
};
