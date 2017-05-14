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

      fs.symlinkSync('/tmp/dir/file', '/tmp/dir/link');
      avfs.symlinkSync('/tmp/dir/file', '/tmp/dir/link');

      fs.openSync('/tmp/dir/perm', 'w', parseInt('222', 8));
      avfs.openSync('/tmp/dir/perm', 'w', parseInt('222', 8));

      fd = {
        read: {
          fs:   fs.openSync('/tmp/dir/file', 'r'),
          avfs: avfs.openSync('/tmp/dir/file', 'r')
        },
        write: {
          fs:   fs.openSync('/tmp/dir/file', 'a'),
          avfs: avfs.openSync('/tmp/dir/file', 'a')
        },
        closed: {
          fs:   fs.openSync('/tmp/dir/file', 'r'),
          avfs: avfs.openSync('/tmp/dir/file', 'r')
        },
        dir: {
          fs:   fs.openSync('/tmp/dir', 'r'),
          avfs: avfs.openSync('/tmp/dir', 'r')
        }
      };

      fs.closeSync(fd.closed.fs);
      avfs.closeSync(fd.closed.avfs);
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
          fs:   [fd.read.fs,   false],
          avfs: [fd.read.avfs, false]
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
          fs:   [fd.read.fs,   -1, 1001],
          avfs: [fd.read.avfs, -1, 1001]
        });
      });

      it('should throw on negative gid parameter', function () {
        check('fchownSync', {
          fs:   [fd.read.fs,   1001, -1],
          avfs: [fd.read.avfs, 1001, -1]
        });
      });

      it('should throw on bad uid parameter type', function () {
        check('fchownSync', {
          fs:   [fd.read.fs,   false, 1001],
          avfs: [fd.read.avfs, false, 1001]
        });
      });

      it('should throw on bad gid parameter type', function () {
        check('fchownSync', {
          fs:   [fd.read.fs,   1001, false],
          avfs: [fd.read.avfs, 1001, false]
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
          fs:   [fd.read.fs,   {}],
          avfs: [fd.read.avfs, {}]
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
          fs:   [fd.read.fs,   false, 0],
          avfs: [fd.read.avfs, false, 0]
        });
      });

      it('should throw on bad mtime parameter type', function () {
        check('futimesSync', {
          fs:   [fd.read.fs,   0, false],
          avfs: [fd.read.avfs, 0, false]
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

    describe('readFileSync()', function () {

      it('should throw on non existing file', function () {
        check('readFileSync', ['/tmp/dir/not']);
      });

      it('should throw on directory', function () {
        check('readFileSync', ['/tmp/dir']);
      });

      it('should throw on unknown encoding', function () {
        check('readFileSync', ['/tmp/dir/file', 'utf5']);
      });

      it('should throw on non string path', function () {
        check('readFileSync', [true]);
      });

      it('should throw on bad options type', function () {
        check('readFileSync', ['/tmp/dir/file', true]);
      });

    });

    describe('readlinkSync()', function () {

      it('should throw on non symlink', function () {
        check('readlinkSync', ['/tmp/dir/file']);
      });

      it('should throw on non existing parent directory', function () {
        check('readlinkSync', ['/tmp/not/file']);
      });

      it('should throw on non directory parent', function () {
        check('readlinkSync', ['/tmp/dir/file/link']);
      });

      it('should throw on non string path', function () {
        check('readlinkSync', [true]);
      });

    });

    describe('readSync()', function () {

      it('should fail on non existing fd', function () {
        check('readSync', [Number.MAX_VALUE, new Buffer(5), 0, 5, 0]);
      });

      it('should fail on closed fd', function () {
        check('readSync', {
          fs:   [fd.closed.fs,   new Buffer(5), 0, 5, 0],
          avfs: [fd.closed.avfs, new Buffer(5), 0, 5, 0]
        });
      });

      it('should fail on non reading fd', function () {
        check('readSync', {
          fs:   [fd.write.fs,   new Buffer(5), 0, 5, 0],
          avfs: [fd.write.avfs, new Buffer(5), 0, 5, 0]
        });
      });

      it('should fail on directory', function () {
        check('readSync', {
          fs:   [fd.dir.fs,   new Buffer(5), 0, 5, 0],
          avfs: [fd.dir.avfs, new Buffer(5), 0, 5, 0]
        });
      });

      it('should throw on bad fd type', function () {
        check('readSync', [true, new Buffer(5), 0, 5, 0]);
      });

      it('should throw on offset out of bounds', function () {
        check('readSync', {
          fs:   [fd.read.fs,   new Buffer(5), 1000, 5, 0],
          avfs: [fd.read.avfs, new Buffer(5), 1000, 5, 0]
        });
      });

      it('should throw on length beyond buffer', function () {
        check('readSync', {
          fs:   [fd.read.fs,   new Buffer(5), 0, 1000, 0],
          avfs: [fd.read.avfs, new Buffer(5), 0, 1000, 0]
        });
      });

    });

    describe('realpathSync()', function () {

      it('should throw on non existing element', function () {
        check('realpathSync', ['/tmp/dir/not']);
      });

      it('should throw on not string path', function () {
        check('realpathSync', [false]);
      });

      it('should throw on not string path in cache', function () {
        check('realpathSync', ['/tmp/dir/file', {'/tmp/dir': false}]);
      });

    });

    after('clean files', function () {
      rimraf.sync('/tmp/dir');
    });

  });
}
