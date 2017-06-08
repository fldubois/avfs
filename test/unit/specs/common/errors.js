'use strict';

var chai   = require('chai');
var expect = chai.expect;

var constants = require('lib/common/constants');
var errors    = require('lib/common/errors');

function expectError(error, message, data) {
  expect(error).to.be.an('error');

  expect(error.message).to.match(message);

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
      'EPERM',
      'nullCheck'
    ]);

    Object.keys(errors).forEach(function (code) {
      expect(errors[code]).to.be.a('function');
    });
  });

  it('should expose EACCES factory', function () {
    expectError(errors.EACCES({
      syscall: 'open',
      path:    '/path/to/file'
    }), /^EACCES/, {
      errno:   constants.EACCES,
      code:    'EACCES',
      path:    '/path/to/file',
      syscall: 'open'
    });
  });

  it('should expose EBADF factory', function () {
    expectError(errors.EBADF({
      syscall: 'open'
    }), /^EBADF/, {
      errno:   constants.EBADF,
      code:    'EBADF',
      syscall: 'open'
    });
  });

  it('should expose EINVAL factory', function () {
    expectError(errors.EINVAL({
      syscall: 'open',
      path:    '/path/to/file'
    }), /^EINVAL/, {
      errno:   constants.EINVAL,
      code:    'EINVAL',
      path:    '/path/to/file',
      syscall: 'open'
    });
  });

  it('should expose ENOTDIR factory', function () {
    expectError(errors.ENOTDIR({
      syscall: 'open',
      path:    '/path/to/file'
    }), /^ENOTDI/, {
      errno:   constants.ENOTDIR,
      code:    'ENOTDIR',
      path:    '/path/to/file',
      syscall: 'open'
    });
  });

  it('should expose EISDIR factory with syscall', function () {
    expectError(errors.EISDIR({
      syscall: 'read'
    }), /^EISDIR/, {
      errno:   constants.EISDIR,
      code:    'EISDIR',
      syscall: 'read'
    });
  });

  it('should expose EISDIR factory with syscall and path', function () {
    expectError(errors.EISDIR({
      syscall: 'open',
      path:    '/path/to/file'
    }), /^EISDIR/, {
      errno:   constants.EISDIR,
      code:    'EISDIR',
      path:    '/path/to/file',
      syscall: 'open'
    });
  });

  it('should expose ENOENT factory', function () {
    expectError(errors.ENOENT({
      syscall: 'open',
      path:    '/path/to/file'
    }), /^ENOENT/, {
      errno:   constants.ENOENT,
      code:    'ENOENT',
      path:    '/path/to/file',
      syscall: 'open'
    });
  });

  it('should expose EEXIST factory', function () {
    expectError(errors.EEXIST({
      syscall: 'open',
      path:    '/path/to/file'
    }), /^EEXIST/, {
      errno:   constants.EEXIST,
      code:    'EEXIST',
      path:    '/path/to/file',
      syscall: 'open'
    });
  });

  it('should expose EPERM factory', function () {
    expectError(errors.EPERM({
      syscall: 'open',
      path:    '/path/to/file'
    }), /^EPERM/, {
      errno:   constants.EPERM,
      code:    'EPERM',
      path:    '/path/to/file',
      syscall: 'open'
    });
  });


});
