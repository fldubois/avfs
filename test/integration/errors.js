'use strict';

var fs   = require('fs');
var path = require('path');

var chai   = require('chai');
var expect = chai.expect;
var rimraf = require('rimraf');

var version = require('lib/common/version');

var supported = fs.readdirSync(path.join(__dirname, '../../lib'));

if (supported.indexOf(version) !== -1) {
  var AVFS = require('lib/avfs');

  var avfs = new AVFS();

  var check = function (method, params) {
    var errors = {};

    try {
      fs[method].apply(fs, params.hasOwnProperty('fs') ? params.fs : params);
    } catch (error) {
      errors.fs = error;
    }

    try {
      avfs[method].apply(avfs, params.hasOwnProperty('avfs') ? params.avfs : params);
    } catch (error) {
      errors.avfs = error;
    }

    expect(errors.avfs.message).to.equal(errors.fs.message);

    expect(Object.keys(errors.avfs)).to.deep.equal(Object.keys(errors.fs));

    Object.keys(errors.avfs).forEach(function (key) {
      expect(errors.avfs[key]).to.equal(errors.fs[key]);
    });
  };

  describe('errors', function () {

    var fd = null;

    before('create files', function () {
      avfs.mkdirSync('/tmp');

      fs.mkdirSync('/tmp/dir');
      avfs.mkdirSync('/tmp/dir');

      fs.writeFileSync('/tmp/dir/file', 'Hello, friend.');
      avfs.writeFileSync('/tmp/dir/file', 'Hello, friend.');

      fs.openSync('/tmp/dir/perm', 'w', parseInt('222', 8));
      avfs.openSync('/tmp/dir/perm', 'w', parseInt('222', 8));

      fd = {
        fs:   fs.openSync('/tmp/dir/file', 'r+'),
        avfs: avfs.openSync('/tmp/dir/file', 'r+')
      };
    });

    describe('appendFileSync()', function () {

      it('should throw on non existing parent directory', function () {
        check('appendFileSync', ['/tmp/dir/not/file', 'Hello, friend.']);
      });

      it('should throw on not directory parent', function () {
        check('appendFileSync', ['/tmp/dir/file/file', 'Hello, friend.']);
      });

      it('should throw on directory path', function () {
        check('appendFileSync', ['/tmp/dir', 'Hello, friend.']);
      });

      it('should throw on unknown encoding', function () {
        check('appendFileSync', ['/tmp/dir/file', 'Hello, friend.', 'utf5']);
      });

      it('should throw on non string path', function () {
        check('appendFileSync', [true]);
      });

      it('should throw on bad options type', function () {
        check('appendFileSync', ['/tmp/dir/file', 'Hello, friend.', true]);
      });

    });

    describe('chmodSync()', function () {

      it('should throw on bad path parameter type', function () {
        check('chmodSync', [false, '0700']);
      });

      it('should throw on bad mode parameter type', function () {
        check('chmodSync', ['/tmp/dir/file', false]);
      });

      it('should throw on non existing file', function () {
        check('chmodSync', ['/tmp/dir/not', '0700']);
      });

      it('should throw on non existing parent directory', function () {
        check('chmodSync', ['/tmp/dir/not/file', '0700']);
      });

      it('should throw on not directory parent', function () {
        check('chmodSync', ['/tmp/dir/file/file', '0700']);
      });

      it('should throw on not owned files', function () {
        check('chmodSync', ['/', '0777']);
      });

    });

    describe('chownSync()', function () {

      it('should throw on bad path parameter type', function () {
        check('chownSync', [false, 1001, 1001]);
      });

      it('should throw on bad uid parameter type', function () {
        check('chownSync', ['/tmp/dir/file', false, 1001]);
      });

      it('should throw on bad gid parameter type', function () {
        check('chownSync', ['/tmp/dir/file', 1001, false]);
      });

      it('should throw on non existing file', function () {
        check('chownSync', ['/tmp/dir/not', 1001, 1001]);
      });

      it('should throw on non existing parent directory', function () {
        check('chownSync', ['/tmp/dir/not/file', 1001, 1001]);
      });

      it('should throw on not directory parent', function () {
        check('chownSync', ['/tmp/dir/file/file', 1001, 1001]);
      });

      it('should throw on permission denied', function () {
        check('chownSync', ['/', 1001, 1001]);
      });

    });

    describe('closeSync()', function () {

      it('should throw on non existing file descriptor', function () {
        check('closeSync', [Number.MAX_VALUE]);
      });

      it('should throw on non integer file descriptor', function () {
        check('closeSync', [false]);
      });

    });

    describe('fchmodSync()', function () {

      it('should throw on non existing file descriptor', function () {
        check('fchmodSync', [Number.MAX_VALUE]);
      });

      it('should throw on non integer file descriptor', function () {
        check('fchmodSync', [false]);
      });

      it('should throw on bad mode parameter type', function () {
        check('fchmodSync', {
          fs:   [fd.fs,   false],
          avfs: [fd.avfs, false]
        });
      });

    });

    describe('fchownSync()', function () {

      it('should throw on non existing file descriptor', function () {
        check('fchownSync', [Number.MAX_VALUE, 1001, 1001]);
      });

      it('should throw on non integer file descriptor', function () {
        check('fchownSync', [true, 1001, 1001]);
      });

      it('should throw on negative uid parameter', function () {
        check('fchownSync', {
          fs:   [fd.fs,   -1, 1001],
          avfs: [fd.avfs, -1, 1001]
        });
      });

      it('should throw on negative gid parameter', function () {
        check('fchownSync', {
          fs:   [fd.fs,   1001, -1],
          avfs: [fd.avfs, 1001, -1]
        });
      });

      it('should throw on bad uid parameter type', function () {
        check('fchownSync', {
          fs:   [fd.fs,   false, 1001],
          avfs: [fd.avfs, false, 1001]
        });
      });

      it('should throw on bad gid parameter type', function () {
        check('fchownSync', {
          fs:   [fd.fs,   1001, false],
          avfs: [fd.avfs, 1001, false]
        });
      });

    });

    describe('fstatSync()', function () {

      it('should throw on non existing file descriptor', function () {
        check('fstatSync', [Number.MAX_VALUE]);
      });

      it('should throw on non integer file descriptor', function () {
        check('fstatSync', [true]);
      });

    });

    describe('fsyncSync()', function () {

      it('should throw on non existing file descriptor', function () {
        check('fsyncSync', [Number.MAX_VALUE]);
      });

      it('should throw on non integer file descriptor', function () {
        check('fsyncSync', [true]);
      });

    });

    describe('ftruncateSync()', function () {

      it('should throw on non existing file descriptor', function () {
        check('ftruncateSync', [Number.MAX_VALUE]);
      });

      it('should throw on non integer file descriptor', function () {
        check('ftruncateSync', [true]);
      });

      it('should throw on non integer length', function () {
        check('ftruncateSync', {
          fs:   [fd.fs,   {}],
          avfs: [fd.avfs, {}]
        });
      });

    });

    describe('futimesSync()', function () {

      it('should throw on non existing file descriptor', function () {
        check('futimesSync', [Number.MAX_VALUE, 0, 0]);
      });

      it('should throw on non integer file descriptor', function () {
        check('futimesSync', [true, 0, 0]);
      });

      it('should throw on bad atime parameter type', function () {
        check('futimesSync', {
          fs:   [fd.fs,   false, 0],
          avfs: [fd.avfs, false, 0]
        });
      });

      it('should throw on bad mtime parameter type', function () {
        check('futimesSync', {
          fs:   [fd.fs,   0, false],
          avfs: [fd.avfs, 0, false]
        });
      });

      it('should throw on bad time parameter type first', function () {
        check('futimesSync', {
          fs:   [true, true, true],
          avfs: [true, true, true]
        });
      });

    });

    describe('linkSync()', function () {

      it('should throw on directory source', function () {
        check('linkSync', ['/tmp/dir', '/tmp/link']);
      });

      it('should throw on existing destination', function () {
        check('linkSync', ['/tmp/dir/file', '/tmp/dir/file']);
      });

      it('should throw on non existing parent directory in source path', function () {
        check('linkSync', ['/tmp/dir/not/file', '/tmp/dir/link']);
      });

      it('should throw on not directory parent in source path', function () {
        check('linkSync', ['/tmp/dir/file/file', '/tmp/dir/link']);
      });

      it('should throw on non existing parent directory in destination path', function () {
        check('linkSync', ['/tmp/dir/file', '/tmp/dir/not/link']);
      });

      it('should throw on not directory parent in destination path', function () {
        check('linkSync', ['/tmp/dir/file', '/tmp/dir/file/link']);
      });

      it('should throw on non string source path', function () {
        check('linkSync', [true, '/tmp/dir/link']);
      });

      it('should throw on non string destination path', function () {
        check('linkSync', ['/tmp/dir/file', true]);
      });

    });

    describe('mkdirSync()', function () {

      it('should throw on existing path', function () {
        check('mkdirSync', ['/tmp/dir']);
      });

      it('should throw on non existing parent directory', function () {
        check('mkdirSync', ['/tmp/not/dir']);
      });

      it('should throw on not directory parent', function () {
        check('mkdirSync', ['/tmp/file/dir']);
      });

      it('should throw on non string path', function () {
        check('mkdirSync', [true]);
      });

    });

    describe('openSync()', function () {

      it('should throw on bad path type', function () {
        check('openSync', [false, 'r']);
      });

      it('should throw on bad flags type', function () {
        check('openSync', ['/tmp/dir/file', false]);
      });

      it('should throw on non unknown flags', function () {
        check('openSync', ['/tmp/dir/file', 'p']);
      });

      it('should throw on non existing file in read mode', function () {
        ['r', 'r+', 'rs', 'rs+'].forEach(function (flags) {
          check('openSync', ['/tmp/dir/not', flags]);
        });
      });

      it('should throw on existing file in exclusive mode', function () {
        ['wx', 'xw', 'wx+', 'xw+', 'ax', 'xa', 'ax+', 'xa+'].forEach(function (flags) {
          check('openSync', ['/tmp/dir/file', flags]);
        });
      });

      it('should throw on directory in write mode', function () {
        ['r+', 'rs+', 'w', 'w+', 'a', 'a+'].forEach(function (flags) {
          check('openSync', ['/tmp/dir', flags]);
        });
      });

      it('should throw on non existing parent directory', function () {
        check('openSync', ['/tmp/not/file', 'w']);
      });

      it('should throw on non directory parent', function () {
        check('openSync', ['/tmp/dir/file/file', 'w']);
      });

      it('should throw on permission denied', function () {
        check('openSync', ['/tmp/dir/perm', 'r']);
      });

    });

    describe('readdirSync()', function () {

      it('should throw on non existing path', function () {
        check('readdirSync', ['/tmp/dir/not']);
      });

      it('should throw on file', function () {
        check('readdirSync', ['/tmp/dir/file']);
      });

      it('should throw on non string path', function () {
        check('readdirSync', [true]);
      });

    });

    after('clean files', function () {
      rimraf.sync('/tmp/dir');
    });

  });
}
