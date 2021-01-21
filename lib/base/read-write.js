'use strict';

var AVFSError = require('../common/avfs-error');

module.exports = function (storage, constants, handles) {
  return {
    read: function (fd, buffer, offset, length, position) {
      if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
        throw new AVFSError('fd:type');
      }

      if (offset > buffer.length) {
        throw new AVFSError('offset:size');
      }

      if ((offset + length) > buffer.length) {
        throw new AVFSError('length:size');
      }

      var bytesRead = 0;

      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed() || !(handles[fd].isReadable())) {
        throw new AVFSError('EBADF');
      }

      var file    = handles[fd].file;
      var content = file.get('content');

      if (file.get('type') === constants.S_IFDIR) {
        throw new AVFSError('EISDIR');
      }

      var pos = (position !== null) ? position : handles[fd].read;

      bytesRead = Math.min(length, Math.max(content.length - pos, 0));

      if (bytesRead > 0) {
        content.copy(buffer, offset, pos, pos + bytesRead);
      }

      if (position === null) {
        handles[fd].read += bytesRead;
      }

      file.set('atime', new Date());

      return bytesRead;
    },
    write: function (fd, buffer, offset, length, position) {
      if (typeof fd === 'undefined' || fd !== parseInt(fd, 10)) {
        throw new AVFSError('fd:type');
      }

      if (!handles.hasOwnProperty(fd) || handles[fd].isClosed() || !handles[fd].isWritable()) {
        throw new AVFSError('EBADF');
      }

      if (!Buffer.isBuffer(buffer)) {
        position = offset;

        var encoding = (typeof length === 'string' && Buffer.isEncoding(length)) ? length : 'utf8';

        buffer = new Buffer(buffer.toString(), encoding);

        offset = 0;
        length = buffer.length;
      }

      if (offset > buffer.length) {
        throw new AVFSError('offset:size');
      }

      if ((offset + length) > buffer.length) {
        throw new AVFSError('length:size');
      }

      if (!length) {
        return 0;
      }

      var file    = handles[fd].file;
      var content = file.get('content');

      var pos = 0;

      if (position !== parseInt(position, 10)) {
        position = null;
      }

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
