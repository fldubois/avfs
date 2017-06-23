'use strict';

module.exports = function (storage, errors, constants, handles) {
  return {
    read: function (fd, buffer, offset, length, position) {
      var bytesRead = 0;

      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed() || !(handles[fd].isReadable())) {
        throw errors.EBADF({syscall: 'read'});
      }

      var file    = handles[fd].file;
      var content = file.get('content');

      if (file.get('type') === constants.S_IFDIR) {
        throw errors.EISDIR({syscall: 'read'});
      }

      var pos = (position !== null) ? position : handles[fd].read;

      bytesRead = Math.min(length, Math.max(content.length - pos, 0));

      if (bytesRead > 0) {
        content.copy(buffer, offset, pos, pos + bytesRead);
      }

      if (position === null) {
        handles[fd].read += bytesRead;
      }

      return bytesRead;
    },
    write: function (fd, buffer, offset, length, position) {
      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed() || !handles[fd].isWritable()) {
        throw errors.EBADF({syscall: 'write'});
      }

      var file    = handles[fd].file;
      var content = file.get('content');

      var pos = 0;

      if (handles[fd].flags & constants.O_APPEND) {
        pos = content.length;
      } else if (position !== null) {
        pos = position;
      } else {
        pos = handles[fd].write;
      }

      if (content.length < pos + length) {
        var tmp = new Buffer(pos + length);

        tmp.fill(' ', content.length, pos + length);

        content.copy(tmp, 0, 0, content.length);

        content = tmp;

        file.set('content', content);
      }

      buffer.copy(content, pos, offset, offset + length);

      if (position === null) {
        handles[fd].write += length;
      }

      return length;
    }
  };
};