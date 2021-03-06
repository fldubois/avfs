'use strict';

var chai   = require('chai');
var expect = chai.expect;
var semver = require('semver');

var constants = require('test/unit/fixtures/constants');

var version = require('lib/common/version');

var errors = require('lib/' + version + '/errors')(constants);

function expectError(error, message, data) {
  expect(error).to.be.an('error');

  expect(error.message).to.match(message);

  Object.keys(data).forEach(function (property) {
    expect(error[property]).to.equal(data[property]);
  });
}

describe('avfs/errors', function () {

  it('should expose factories', function () {
    expect(errors).to.be.an('object');

    expect(errors).to.include.all.keys([
      'EACCES',
      'EBADF',
      'EINVAL',
      'ENOTDIR',
      'EISDIR',
      'ENOENT',
      'EEXIST',
      'EPERM'
    ]);

    Object.keys(errors).filter(function (code) {
      return /^E[A-Z]+$/.test(code);
    }).forEach(function (code) {
      expect(errors[code]).to.be.a('function');
    });
  });

  it('should expose nullCheck()', function () {
    expect(errors.nullCheck).to.be.a('function');
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

  it('should expose EBADF factory with message', function () {
    var data = {
      errno: constants.EBADF,
      code:  'EBADF'
    };

    if (semver.gte(process.version, '4.0.0')) {
      data.syscall = 'write';
    }

    expectError(errors.EBADF('write'), /^EBADF/, data);
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

  it('should expose EISDIR factory with message', function () {
    var data = {
      errno: constants.EISDIR,
      code:  'EISDIR'
    };

    if (semver.gte(process.version, '4.0.0')) {
      data.syscall = 'read';
    }

    expectError(errors.EISDIR('read'), /^EISDIR/, data);
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
