'use strict';

var chai   = require('chai');
var expect = chai.expect;

var errors = require('lib/common/errors');

function expectError(error, message, data) {
  expect(error).to.be.an('error');

  expect(error.message).to.equal(message);

  Object.keys(data).forEach(function (property) {
    expect(error[property]).to.equal(data[property]);
  });
}

describe('common/errors', function () {

  it('should expose factories', function () {
    expect(errors).to.be.an('object');

    expect(errors).to.have.keys([
      'EACCES',
      'EBADF',
      'EINVAL',
      'ENOTDIR',
      'EISDIR',
      'ENOENT',
      'EEXIST',
      'EPERM'
    ]);

    Object.keys(errors).forEach(function (code) {
      expect(errors[code]).to.be.a('function');
    });
  });

  it('should expose EACCES factory', function () {
    expectError(errors.EACCES('open', '/path/to/file'), 'EACCES, permission denied \'/path/to/file\'', {
      errno:   3,
      code:    'EACCES',
      path:    '/path/to/file',
      syscall: 'open'
    });
  });

  it('should expose EBADF factory', function () {
    expectError(errors.EBADF('open'), 'EBADF, bad file descriptor', {
      errno:   9,
      code:    'EBADF',
      syscall: 'open'
    });
  });

  it('should expose EINVAL factory', function () {
    expectError(errors.EINVAL('open', '/path/to/file'), 'EINVAL, invalid argument \'/path/to/file\'', {
      errno:   18,
      code:    'EINVAL',
      path:    '/path/to/file',
      syscall: 'open'
    });
  });

  it('should expose ENOTDIR factory', function () {
    expectError(errors.ENOTDIR('open', '/path/to/file'), 'ENOTDIR, not a directory \'/path/to/file\'', {
      errno:   27,
      code:    'ENOTDIR',
      path:    '/path/to/file',
      syscall: 'open'
    });
  });

  it('should expose EISDIR factory with path', function () {
    expectError(errors.EISDIR('open', '/path/to/file'), 'EISDIR, illegal operation on a directory \'/path/to/file\'', {
      errno:   28,
      code:    'EISDIR',
      path:    '/path/to/file',
      syscall: 'open'
    });
  });

  it('should expose EISDIR factory without path', function () {
    expectError(errors.EISDIR('read'), 'EISDIR, read', {
      errno: 28,
      code:  'EISDIR'
    });
  });

  it('should expose ENOENT factory', function () {
    expectError(errors.ENOENT('open', '/path/to/file'), 'ENOENT, no such file or directory \'/path/to/file\'', {
      errno:   34,
      code:    'ENOENT',
      path:    '/path/to/file',
      syscall: 'open'
    });
  });

  it('should expose EEXIST factory', function () {
    expectError(errors.EEXIST('open', '/path/to/file'), 'EEXIST, file already exists \'/path/to/file\'', {
      errno:   47,
      code:    'EEXIST',
      path:    '/path/to/file',
      syscall: 'open'
    });
  });

  it('should expose EPERM factory', function () {
    expectError(errors.EPERM('open', '/path/to/file'), 'EPERM, operation not permitted \'/path/to/file\'', {
      errno:   50,
      code:    'EPERM',
      path:    '/path/to/file',
      syscall: 'open'
    });
  });


});
