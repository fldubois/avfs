'use strict';

function AVFSError(code, path) {
  this.name = 'AVFSError';

  this.message = 'AVFS Error';
  this.code    = code;
  this.path    = path;

  Error.captureStackTrace(this, AVFSError);
}

AVFSError.prototype = Object.create(Error.prototype, {
  constructor: {
    value: AVFSError
  }
});

module.exports = AVFSError;
