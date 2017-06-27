'use strict';

function AVFSError(code) {
  this.name = 'AVFSError';

  this.message = 'AVFS Error';
  this.code    = code;

  Error.captureStackTrace(this, AVFSError);
}

AVFSError.prototype = Object.create(Error.prototype, {
  constructor: {
    value: AVFSError
  }
});

module.exports = AVFSError;
