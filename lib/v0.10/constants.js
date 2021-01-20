'use strict';

module.exports = {
  // File Open Constants

  O_RDONLY:    0,      // Flag indicating to open a file for read-only access.
  O_WRONLY:    1,      // Flag indicating to open a file for write-only access.
  O_RDWR:      2,      // Flag indicating to open a file for read-write access.
  O_CREAT:     64,     // Flag indicating to create the file if it does not already exist.
  O_EXCL:      128,    // Flag indicating that opening a file should fail if the O_CREAT flag is set and the file already exists.
  O_NOCTTY:    256,    // Flag indicating that if path identifies a terminal device, opening the path shall not cause that terminal to become the controlling terminal for the process (if the process does not already have one).
  O_TRUNC:     512,    // Flag indicating that if the file exists and is a regular file, and the file is opened successfully for write access, its length shall be truncated to zero.
  O_APPEND:    1024,   // Flag indicating that data will be appended to the end of the file.
  O_NONBLOCK:  2048,   // Flag indicating to open the file in nonblocking mode when possible.
  O_SYNC:      4096,   // Flag indicating that the file is opened for synchronous I/O.
  O_DIRECT:    16384,  // When set, an attempt will be made to minimize caching effects of file I/O.
  O_DIRECTORY: 65536,  // Flag indicating that the open should fail if the path is not a directory.
  O_NOFOLLOW:  131072, // Flag indicating that the open should fail if the path is a symbolic link.
  O_NOATIME:   262144, // Flag indicating reading accesses to the file system will no longer result in an update to the atime information associated with the file. This flag is available on Linux operating systems only.

  // File Type Constants

  S_IFMT:   61440, // Bit mask used to extract the file type code.
  S_IFSOCK: 49152, // File type constant for a socket.
  S_IFLNK:  40960, // File type constant for a symbolic link.
  S_IFREG:  32768, // File type constant for a regular file.
  S_IFBLK:  24576, // File type constant for a block-oriented device file.
  S_IFDIR:  16384, // File type constant for a directory.
  S_IFCHR:  8192,  // File type constant for a character-oriented device file.
  S_IFIFO:  4096,  // File type constant for a FIFO/pipe.

  // File Mode Constants

  S_IRWXU: 448, // 0o700 | File mode indicating readable, writable and executable by owner.
  S_IRUSR: 256, // 0o400 | File mode indicating readable by owner.
  S_IWUSR: 128, // 0o200 | File mode indicating writable by owner.
  S_IXUSR: 64,  // 0o100 | File mode indicating executable by owner.
  S_IRWXG: 56,  // 0o070 | File mode indicating readable, writable and executable by group.
  S_IRGRP: 32,  // 0o040 | File mode indicating readable by group.
  S_IWGRP: 16,  // 0o020 | File mode indicating writable by group.
  S_IXGRP: 8,   // 0o010 | File mode indicating executable by group.
  S_IRWXO: 7,   // 0o007 | File mode indicating readable, writable and executable by others.
  S_IROTH: 4,   // 0o004 | File mode indicating readable by others.
  S_IWOTH: 2,   // 0o002 | File mode indicating writable by others.
  S_IXOTH: 1,   // 0o001 | File mode indicating executable by others.

  // Error codes

  EACCES:  3,
  EBADF:   9,
  EEXIST:  47,
  EINVAL:  18,
  EISDIR:  28,
  ELOOP:   51,
  ENOENT:  34,
  ENOTDIR: 27,
  EPERM:   50
};
