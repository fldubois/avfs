'use strict';

function AVFSError(code, data) {
  this.name = 'AVFSError';

  this.message = 'AVFS Error';
  this.code    = code;

  Object.keys(data || {}).forEach(function (property) {
    this[property] = data[property];
  }.bind(this));

  Error.captureStackTrace(this, AVFSError);
}

AVFSError.prototype = Object.create(Error.prototype, {
  constructor: {
    value: AVFSError
  }
});

module.exports = AVFSError;
