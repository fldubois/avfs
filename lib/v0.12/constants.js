'use strict';

module.exports = {
  // File flags

  S_IFMT:   61440, // 0170000 - bit mask for the file type bit fields
  S_IFSOCK: 49152, // 0140000 - socket
  S_IFLNK:  40960, // 0120000 - symbolic link
  S_IFREG:  32768, // 0100000 - regular file
  S_IFBLK:  24576, // 0060000 - block device
  S_IFDIR:  16384, // 0040000 - directory
  S_IFCHR:  8192,  // 0020000 - character device
  S_IFIFO:  4096,  // 0010000 - FIFO
  S_ISUID:  2048,  // 0004000 - set UID bit
  S_ISGID:  1024,  // 0002000 - set-group-ID bit (see below)
  S_ISVTX:  512,   // 0001000 - sticky bit (see below)
  S_IRWXU:  448,   // 0000700 - mask for file owner permissions
  S_IRUSR:  256,   // 0000400 - owner has read permission
  S_IWUSR:  128,   // 0000200 - owner has write permission
  S_IXUSR:  64,    // 0000100 - owner has execute permission
  S_IRWXG:  56,    // 0000070 - mask for group permissions
  S_IRGRP:  32,    // 0000040 - group has read permission
  S_IWGRP:  16,    // 0000020 - group has write permission
  S_IXGRP:  8,     // 0000010 - group has execute permission
  S_IRWXO:  7,     // 0000007 - mask for permissions for others (not in group)
  S_IROTH:  4,     // 0000004 - others have read permission
  S_IWOTH:  2,     // 0000002 - others have write permission
  S_IXOTH:  1,     // 0000001 - others have execute permission

  // Open modes

  O_RDONLY: 1,
  O_WRONLY: 2,
  O_RDWR:   4,
  O_CREAT:  8,
  O_EXCL:   16,
  O_TRUNC:  32,
  O_APPEND: 64,

  // Error codes

  EACCES:  -3,
  EBADF:   -9,
  EINVAL:  -18,
  ENOTDIR: -27,
  EISDIR:  -28,
  ENOENT:  -34,
  EEXIST:  -47,
  EPERM:   -50,

  // Access modes

  F_OK: 0,
  R_OK: 4,
  W_OK: 2,
  X_OK: 1
};
